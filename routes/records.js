const router = require("express").Router();
const pool = require("../db");

// VALIDATE RECORD DATA
function validateRecord(body) {
    const fields = ["title", "category", "description", "status"];

    for (const field of fields) {
        if (typeof body[field] !== "string") {
            return `${field} must be text.`;
        }
    }

    const title = body.title.trim();
    const category = body.category.trim();
    const description = body.description.trim();
    const status = body.status.trim();

    if (title.length < 3 || title.length > 80) {
        return "Title must have 3 to 80 characters.";
    }

    if (category.length < 2 || category.length > 40) {
        return "Category must have 2 to 40 characters.";
    }

    if (description.length < 5 || description.length > 300) {
        return "Description must have 5 to 300 characters.";
    }

    if (!["Pending", "In progress", "Completed"].includes(status)) {
        return "Invalid status.";
    }

    return null;
}

// GET ALL RECORDS
router.get("/", async (req, res, next) => {
    try {
        const result = await pool.query(
            "SELECT id, title, category, description, status FROM records ORDER BY id"
        );

        res.status(200).json(result.rows);
    } catch (error) {
        next(error);
    }
});

// CHECK RECORD ID
function validId(id) {
    return /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));
}

// GET ONE RECORD
router.get("/:id", async (req, res, next) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid record ID."
            });
        }

        const result = await pool.query(
            "SELECT * FROM records WHERE id = $1",
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// POST - CREATE RECORD
router.post("/", async (req, res, next) => {
    try {
        const error = validateRecord(req.body || {});

        if (error) {
            return res.status(400).json({ message: error });
        }

        const { title, category, description, status } = req.body;

        const result = await pool.query(
            `INSERT INTO records
            (title, category, description, status)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [
                title.trim(),
                category.trim(),
                description.trim(),
                status.trim()
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// PUT - UPDATE RECORD
router.put("/:id", async (req, res, next) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid record ID."
            });
        }

        const error = validateRecord(req.body || {});

        if (error) {
            return res.status(400).json({ message: error });
        }

        const { title, category, description, status } = req.body;

        const result = await pool.query(
            `UPDATE records
            SET title = $1, category = $2,
            description = $3, status = $4
            WHERE id = $5
            RETURNING *`,
            [
                title.trim(),
                category.trim(),
                description.trim(),
                status.trim(),
                req.params.id
            ]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        next(error);
    }
});

// DELETE - REMOVE RECORD
router.delete("/:id", async (req, res, next) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid record ID."
            });
        }

        const result = await pool.query(
            "DELETE FROM records WHERE id = $1 RETURNING id",
            [req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({
                message: "Record not found."
            });
        }

        res.status(200).json({
            message: "Record deleted."
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;