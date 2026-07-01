import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadFile = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "No file uploaded"

            });

        }

        const streamUpload = () => {

            return new Promise((resolve, reject) => {

                const stream = cloudinary.uploader.upload_stream(

                    {
                        folder: "devflow-ai"
                    },

                    (error, result) => {

                        if (result) {

                            resolve(result);

                        } else {

                            reject(error);

                        }

                    }

                );

                streamifier
                    .createReadStream(req.file.buffer)
                    .pipe(stream);

            });

        };

        const result = await streamUpload();

        return res.status(200).json({

            success: true,

            message: "File uploaded successfully",

            file: {

                url: result.secure_url,

                publicId: result.public_id,

                originalName: req.file.originalname,

                size: req.file.size

            }

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Upload failed"

        });

    }

};


export const deleteFile = async (req, res) => {

    try {

        const { publicId } = req.params;

        await cloudinary.uploader.destroy(publicId);

        return res.status(200).json({

            success: true,

            message: "File deleted successfully"

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Delete failed"

        });

    }

};