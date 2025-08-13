import { getUserSocketId, io } from "../lib/socket.io.js";
import { uploadMultipleImages } from "../lib/util/cloudinary.js";
import Message from "../models/Message.model.js";
import User from "../models/User.model.js";


// testing purpose
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));


export const getUsersForSidebar = async (req, res) => {
    try {

        // await delay(5000)
        // return res.status(500).json({
        //     message: "Somthing went wrong!",
        // });


        const loggedInUserId = req.user._id;

        // Fetch users except the logged-in user
        const filterUsers = await User.find({ _id: { $ne: loggedInUserId } })
            .select('-password')
            .lean(); // Use lean() for better performance

        // Get the last message for each user
        const usersWithLastMessages = await Promise.all(
            filterUsers.map(async (user) => {
                const lastMessage = await Message.findOne({
                    $or: [
                        { senderId: loggedInUserId, receiverId: user._id },
                        { senderId: user._id, receiverId: loggedInUserId },
                    ],
                })
                    .sort({ createdAt: -1 }) // Sort by the latest message
                    .lean();

                return {
                    ...user,
                    lastMessage: lastMessage || null, // Attach last message or null
                };
            })
        );

        res.status(200).json(usersWithLastMessages);
    } catch (error) {
        res.status(500).json({
            error: 1,
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error',
        });
    }
};


export const getMessages = async (req, res) => {


    try {
        // await delay(3000);
        // return res.status(500).json({message: "Opps! Internal Server Error"});
        const myId = req.user._id;
        const { id: userToChatId } = req.params;


        const messages = await Message.find({
            $or: [
                {
                    senderId: myId,
                    receiverId: userToChatId
                },
                {
                    senderId: userToChatId,
                    receiverId: myId
                },
            ],
        });


        res.status(200).json(messages);

    } catch (error) {
        res.status(500).json({
            error: 1,
            message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error",
        });
    }

}

export const sendMessage = async (req, res) => {

    // console.log(req.files);
    

    // res.status(201).json({
    //     message : "hiting the file upload endpoint!",
    //     data : req.body.text_message
    // });
    // return;
    try {
        const { text_message } = req.body;
        const senderId = req.user._id;
        const { id: receiverId } = req.params;

        const attachments = req.files || [];

        const arrayOfPublicId = [];
        const arrayOfBuffer = [];
        let secureUrls = [];



        // return;
        if (!text_message || text_message === '') return res.status(400).json({ error: 1, message: "Please write any message" });

        attachments.forEach(file => {
            arrayOfPublicId.push(`chat_${file.originalname}`);
            arrayOfBuffer.push(file.buffer);
        });

        if (arrayOfPublicId.length > 0 && arrayOfBuffer.length > 0) {
            const results = await uploadMultipleImages(arrayOfBuffer, arrayOfPublicId);
            secureUrls = results.map(result => result.secure_url); // Now reassignment works
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text: text_message,
            images: secureUrls,
        });

        await newMessage.save();

        const reciverSocketID = getUserSocketId(receiverId);

        // console.log('receiver id:', receiverId);
        // console.log('sender id:', senderId);
        // console.log('receiver socket_id:', reciverSocketID);

        if (reciverSocketID) {
            io.to(reciverSocketID).emit('newMessage', newMessage);
            io.to(reciverSocketID).emit('NewMsgArrived', newMessage);
        };

        res.status(201).json({
            error: 0,
            message: "Message sent successfully",
            newMessage,
        });

    } catch (error) {
        res.status(500).json({
            error: 1,
            message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error",
        });
    }
}


export const updateMessageAsSeen = async (req, res) => {
    try {
        const authUserId = req.user._id; // logged-in user (receiver)
        const { selectedUserId } = req.params; // sender ID

        // Update messages as seen
        const result = await Message.updateMany(
            { senderId: selectedUserId, receiverId: authUserId, isSeen: false },
            { $set: { isSeen: true } }
        );

        if (result.modifiedCount > 0) {
            // Fetch updated messages for the sender
            const updatedMessages = await Message.find({
                senderId: selectedUserId,
                receiverId: authUserId,
                isSeen: true,
            });

            // Emit the markAsSeen event to the sender
            io.to(getUserSocketId(selectedUserId)).emit('markAsSeen', {
                senderId: authUserId,
                messages: updatedMessages, // Send all updated messages
            });

            return res.status(200).json({
                error: 0,
                message: "Messages updated as seen",
                response: updatedMessages,
            });
        }

        res.status(200).json({ error: 0, message: "No unseen messages to update." });
    } catch (error) {
        res.status(500).json({
            error: 1,
            message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error",
        });
    }
};

export const unseenMessagesCountForPerson = async (req, res) => {

    const userId = req.user._id;

    // console.log(userId);

    try {


        const response = await Message.aggregate(
            [
                {
                    $match: {
                        receiverId: userId,
                        isSeen: false
                    }
                },
                {
                    $group: {
                        _id: "$senderId",
                        count: { $sum: 1 }
                    }
                }
            ]
        );


        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({
            error: 1,
            message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"

        });
    }
}


export const getLastMessageForAllUsers = async (req, res) => {

    const userId = req.user._id;

    try {

        const response = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ["$senderId", userId] },
                            then: "$receiverId",
                            else: "$senderId"
                        }
                    },
                    lastMessage: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$lastMessage" }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "sender"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "receiverId",
                    foreignField: "_id",
                    as: "receiver"
                }
            },
            {
                $unwind: "$sender"
            },
            {
                $unwind: "$receiver"
            },
            {
                $project: {
                    text: 1,
                    sender: { _id: 1, fullName: 1, email: 1, profilePic: 1 },
                    receiver: { _id: 1, fullName: 1, email: 1, profilePic: 1 },
                    createdAt: 1,
                    isSeen: 1,
                    images: 1
                }
            }
        ]);

        res.status(200).json(response);

    } catch (error) {
        res.status(500).json({
            error: 1,
            message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"

        });
    }

}

export const deleteMessage = async (req, res) => {

    const { messageId } = req.params;

    try {
        const response = await Message.findByIdAndDelete(messageId);


        if (!response) {
            return res.status(404).json({
                error: 1,
                message: "Message not found"
            });
        }

        const receiverSocketId = getUserSocketId(response.receiverId);

        // console.log(receiverSocketId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('deleteMessage', response._id);

        }

        res.status(200).json({
            error: 0,
            message: "Message deleted successfully"
        })
    } catch (error) {
        res.status(500).json({
            error: 1,
            message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"

        });
    }
}

export const clearChats = async (req, res) => {

    const { selectedUserId } = req.params;
    const deleterId = req.user._id;

    try {
        const response = await Message.deleteMany({
            $or: [
                { senderId: deleterId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: deleterId }
            ]
        });

        // console.log(response);

        const receiverSocketId = getUserSocketId(selectedUserId);

        // console.log(receiverSocketId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('chatsCleared', deleterId);

        }

        res.status(200).json({
            error: 0,
            message: "Chat cleared successfully"
        });

    } catch (error) {
        res.status(500).json({
            error: 1,
            message: process.env.NODE_ENV === "development" ? error.message : "Internal Server Error"

        });
    }
}
