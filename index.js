if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();

const cors = require("cors");
app.use(cors());

const port = process.env.PORT || 80;
const mongoose = require("mongoose");
const User = require("./models/user");
const uri = process.env.MONGODB_URI;

// MongoDB connection
try {
    mongoose.connect(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
    });
    console.log("MongoDB connection established.");
} catch (error) {
    console.log(error);
}

process.on("unhandledRejection", (err) => {
    console.log("unhandledRejection", err.message);
});

app.use(express.json());

const addUser = async (user) => {
    /*
    Adds a new user to the database.
    */

    // Verify that the new user to be created has an email
    if (!user || !user.email) {
        throw "Must pass a new user object with an email.";
    }

    // See if a user with that email address already exists
    const userExists = await User.findOne({ email: user.email });

    // If the user doesn't exist in the db, add it to the db
    if (!userExists) {
        const newUser = await new User(user);
        return newUser.save();
    } else {
        throw "User with that email already exists.";
    }
};

const deleteUser = async (userId) => {
    /*
    Delete a user by the given user Id.
    */

    if (!userId) {
        throw "A user ID must be provided.";
    }

    const result = await User.deleteOne({ _id: userId });
    return result.deletedCount;
};

const addGiftExchange = async (newGiftExchange) => {
    /*
    Adds a new gift exchange to a user's array of gift exchanges
    */

    const { name, _id } = newGiftExchange;

    // Make sure a new gift exchange was passed with name and _id properties.
    if (!newGiftExchange || !name || !_id) {
        throw "Must pass a new gift exchange object with a name and _id.";
    }

    // Grab user by the given userId
    const user = await User.findById(_id);

    if (!user) {
        throw "User with provided user ID not found.";
    }

    // Add new gift exchange to user's exchanges if its name is unique
    if (user.giftExchanges.some((xchg) => xchg.name === name)) {
        throw "Gift exchange with that name already exists.";
    } else {
        user.giftExchanges.push({ name });
        return user.save();
    }
};

const updateGiftExchange = async (updateDetails) => {
    // Updates a gift exchange's name for a user.
    const { userId, giftExchangeId, newName } = updateDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    } else if (!newName) {
        throw "A new name for the gift exchange must be provided.";
    }

    return User.updateOne(
        { _id: userId },
        {
            $set: {
                "giftExchanges.$[i].name": newName,
            },
        },
        {
            arrayFilters: [{ "i._id": giftExchangeId }],
        }
    );
};

const deleteGiftExchange = async (exchangeDetails) => {
    // Deletes a gift exchange from a specific user's gift exchanges.

    const { userId, giftExchangeId } = exchangeDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    }

    const user = await User.findById(userId);

    if (!user) {
        throw "User with provided user ID not found.";
    }

    user.giftExchanges.pull(giftExchangeId);

    return user.save();
};

const addDrawing = async (drawingDetails) => {
    /*
    Adds a new drawing to a user's gift exchange.
    */

    const { userId, giftExchangeId, drawingYear } = drawingDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    } else if (!drawingYear) {
        throw "A year for the drawing must be provided.";
    }

    const user = await User.findById(userId);

    if (!user) {
        throw "User with provided user ID not found.";
    }

    const giftExchange = user.giftExchanges.id(giftExchangeId);

    if (!giftExchange) {
        throw "Gift exchange with provided ID not found.";
    }

    const drawExists = giftExchange.draws.some((draw) => draw.year === drawingYear);

    if (!drawExists) {
        giftExchange.draws.push({ year: drawingYear });
    }

    return user.save();
};

const deleteDrawing = async (drawingDetails) => {
    // Deletes a gift exchange from a specific user's gift exchanges.

    const { userId, giftExchangeId, drawingId } = drawingDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    }

    const user = await User.findById(userId);

    if (!user) {
        throw "User with provided user ID not found.";
    }

    const giftExchange = user.giftExchanges.id(giftExchangeId);

    if (!giftExchange) {
        throw "Gift exchange with provided ID not found.";
    }

    giftExchange.draws.pull(drawingId);

    return user.save();
};

const addParticipant = async (requestDetails) => {
    // Adds a new participant for given userId, giftExchangeId, and drawingId.
    const { userId, giftExchangeId, drawingId, newParticipant } = requestDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    } else if (!drawingId) {
        throw "A drawing ID must be provided.";
    } else if (!newParticipant) {
        throw "A new participant object must be provided";
    } else if (!newParticipant.name) {
        throw "A name must be provided for the new participant.";
    }

    const user = await User.findById(userId);

    if (!user) {
        throw "User with provided user ID not found.";
    }

    const giftExchange = user.giftExchanges.id(giftExchangeId);

    if (!giftExchange) {
        throw "Gift exchange with provided ID not found.";
    }

    const drawing = giftExchange.draws.id(drawingId);

    if (!drawing) {
        throw "Drawing with provided ID not found.";
    }

    const participantExists = drawing.participants.some((participant) => participant.name === newParticipant.name);

    if (!participantExists) {
        drawing.participants.push(newParticipant);
    }

    return user.save();
};

const deleteParticipant = async (participantDetails) => {
    // Deletes a gift exchange from a specific user's gift exchanges.

    const { userId, giftExchangeId, drawingId, participantId } = participantDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    } else if (!drawingId) {
        throw "A drawing ID must be provided.";
    } else if (!participantId) {
        throw "A participant ID must be provided.";
    }

    const user = await User.findById(userId);

    if (!user) {
        throw "User with provided user ID not found.";
    }

    const giftExchange = user.giftExchanges.id(giftExchangeId);

    if (!giftExchange) {
        throw "Gift exchange with provided ID not found.";
    }

    const drawing = giftExchange.draws.id(drawingId);

    if (!drawing) {
        throw "Drawing with provided ID not found.";
    }

    drawing.participants.pull(participantId);

    return user.save();
};

const updateParticipant = async (updateDetails) => {
    // Updates a participant's name, email, and/or secretDraw given the user, gift exchange, drawing, and participant IDs.

    const { userId, giftExchangeId, drawingId, participantId, updates } = updateDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    } else if (!drawingId) {
        throw "A drawing ID must be provided.";
    } else if (!participantId) {
        throw "A participant ID must be provided.";
    } else if (
        !updates.hasOwnProperty("name") &&
        !updates.hasOwnProperty("email") &&
        !updates.hasOwnProperty("secretDraw")
    ) {
        throw "An updates object with a name, email, or secretDraw must be provided.";
    }

    // build set object. updates may have one or more of name, email, and secretDraw
    const setObject = {};
    if (updates.name) {
        setObject["giftExchanges.$[i].draws.$[j].participants.$[k].name"] = updates.name;
    }
    if (updates.email) {
        setObject["giftExchanges.$[i].draws.$[j].participants.$[k].email"] = updates.email;
    }
    if (updates.hasOwnProperty("secretDraw")) {
        setObject["giftExchanges.$[i].draws.$[j].participants.$[k].secretDraw"] = updates.secretDraw;
    }

    return User.updateOne(
        { _id: userId },
        {
            $set: setObject,
        },
        {
            arrayFilters: [{ "i._id": giftExchangeId }, { "j._id": drawingId }, { "k._id": participantId }],
        }
    );
};

const addRestriction = async (restrictionDetails) => {
    // Adds a restriction to a participant's restrictions if the name isn't already in the array.
    const { userId, giftExchangeId, drawingId, participantId, restrictionName } = restrictionDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    } else if (!drawingId) {
        throw "A drawing ID must be provided.";
    } else if (!participantId) {
        throw "A participant ID must be provided.";
    } else if (!restrictionName) {
        throw "A restriction name must be provided.";
    }

    return User.updateOne(
        { _id: userId },
        {
            $addToSet: { "giftExchanges.$[i].draws.$[j].participants.$[k].restrictions": restrictionName },
        },
        {
            arrayFilters: [{ "i._id": giftExchangeId }, { "j._id": drawingId }, { "k._id": participantId }],
        }
    );
};

const deleteRestriction = async (restrictionDetails) => {
    // Adds a restriction to a participant's restrictions if the name isn't already in the array.
    const { userId, giftExchangeId, drawingId, participantId, restrictionName } = restrictionDetails;

    if (!userId) {
        throw "A user ID must be provided.";
    } else if (!giftExchangeId) {
        throw "A gift exchange ID must be provided.";
    } else if (!drawingId) {
        throw "A drawing ID must be provided.";
    } else if (!participantId) {
        throw "A participant ID must be provided.";
    } else if (!restrictionName) {
        throw "A restriction name must be provided.";
    }

    return User.updateOne(
        { _id: userId },
        {
            $pull: { "giftExchanges.$[i].draws.$[j].participants.$[k].restrictions": restrictionName },
        },
        {
            arrayFilters: [{ "i._id": giftExchangeId }, { "j._id": drawingId }, { "k._id": participantId }],
        }
    );
};

app.get("/", (req, res) => {
    res.send("secretSanta Backend is up and running!");
});

app.get("/user/exists/:email", async (req, res) => {
    // Return true/false if a user exists in the database.
    const { email } = req.params;

    if (!email) {
        res.status(400).send("Must include an email address to get the user's data.");
    }

    try {
        const user = await User.findOne({ email: email });
        if (user) {
            res.send(true);
        } else {
            res.send(false);
        }
    } catch (error) {
        res.status(500).json({ Error: `Request failed. ${error}` });
    }
});

app.get("/user/:email", async (req, res) => {
    // Get user data for a specified user by e-mail address
    const { email } = req.params;

    if (!email) {
        res.status(400).send("Must include an email address to get the user's data.");
    }

    try {
        const user = await User.findOne({ email: email });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(404).json({ Error: "Request failed. User not found." });
        }
    } catch (error) {
        res.status(500).json({ Error: `Request failed. ${error}` });
    }
});

app.post("/user", (req, res) => {
    // Add a new user. Request body should be a JSON object with email property.
    addUser(req.body)
        .then((newUser) => {
            res.status(201).json(newUser);
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.delete("/user", (req, res) => {
    // Delete an existing user by _id
    const { _id } = req.body;

    deleteUser(_id)
        .then((deletedCount) => {
            if (deletedCount === 1) {
                res.status(204).send();
            } else {
                res.status(500).json({ Error: "User not found." });
            }
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.post("/giftExchange", (req, res) => {
    // Add a gift exchange. Request body should be a JSON object with name and _id properties.
    addGiftExchange(req.body)
        .then((newGiftExchange) => {
            res.status(201).json(newGiftExchange);
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.patch("/giftExchange", (req, res) => {
    // Update a gift exchange's name.

    updateGiftExchange(req.body)
        .then((modifiedObj) => {
            if (modifiedObj.modifiedCount === 1) {
                res.status(200).json(modifiedObj);
            } else {
                res.status(404).json({ Error: "Resource not found or updated.", modifiedObj });
            }
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.delete("/giftExchange", (req, res) => {
    // Delete a gift exchange from a user's gift exchanges, req.body should have userId and giftExchangeId
    deleteGiftExchange(req.body)
        .then(() => {
            res.status(204).send();
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.post("/drawing", (req, res) => {
    // Add a new drawing. Request body should be a JSON object with userId, giftExchangeId, drawingYear.
    addDrawing(req.body)
        .then((user) => {
            res.status(201).json(user);
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.delete("/drawing", (req, res) => {
    // Deletes a drawing. Request body should be a JSON object with userId, giftExchangeId, drawingId
    deleteDrawing(req.body)
        .then(() => {
            res.status(204).send();
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.post("/participant", (req, res) => {
    // Add a participant. Request body should be a JSON object with userId, giftExchangeId, drawingId,
    // and newParticipant (object with name and email)
    addParticipant(req.body)
        .then((newParticipant) => {
            res.status(201).json(newParticipant);
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.delete("/participant", (req, res) => {
    // Deletes a participant. Request body should be a JSON object with userId, giftExchangeId, drawingId, participantId
    deleteParticipant(req.body)
        .then(() => {
            res.status(204).send();
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.patch("/participant", (req, res) => {
    // Update a participant's name and email.
    updateParticipant(req.body)
        .then((modifiedObj) => {
            if (modifiedObj.matchedCount === 1) {
                res.status(200).json(modifiedObj);
            } else {
                res.status(404).json({ Error: "Resource not found or updated.", modifiedObj });
            }
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.post("/restriction", (req, res) => {
    // Add a restriction to a participant restrictions if the restriction doesn't exist.
    addRestriction(req.body)
        .then((modifiedObj) => {
            if (modifiedObj.modifiedCount === 1) {
                res.status(201).json(modifiedObj);
            } else {
                res.status(404).json({
                    Error: "Resource not found or updated or restriction already existed.",
                    modifiedObj,
                });
            }
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.delete("/restriction", (req, res) => {
    // Delete a restriction from a participant's restriction if it exists.
    deleteRestriction(req.body)
        .then((modifiedObj) => {
            if (modifiedObj.modifiedCount === 1) {
                res.status(200).json(modifiedObj);
            } else {
                res.status(404).json({
                    Error: "Resource not found or deleted or restriction didn't exist.",
                    modifiedObj,
                });
            }
        })
        .catch((error) => {
            res.status(500).json({ Error: `Request failed. ${error}` });
        });
});

app.listen(port, () => {
    console.log(`secretSanta Backend is listening on port ${port}.`);
});
