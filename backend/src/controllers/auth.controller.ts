import pool from "../database/db"

// Fetch all user credentials from the database.
export const getAuthority = async (req: Request, res: any) => {
    try {
        const [rows] = await pool.query("SELECT * FROM user");
        res.json(rows);
        res.json({ message: "User Credentials fetched." });
    } catch (error) {
        res.status(500).json({ message: "Error fetch." });
    };
};

//Add a new user to the database.
export const postAuthority = async (req: any, res: any) => {
    try {
        const { username, password, role } = req.body;

        await pool.query(
            "INSERT INTO user (username, password, role) VALUES (? ,? ,?)",
            [username, password, role]
        );

        res.json({ message: "Sign up complete." });
    } catch (error) {
        res.status(500).json({ message: "Error, cannot add." });
    };
};

//Update an existing user credentials in the database.
export const UpdateAuthority = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const { username, password, role } = req.body;

        await pool.query(
            "UPDATE user SET username = ?, password = ?, role = ? WHERE id = ?",
            [username, password, role, id]
        );

        res.json({ message: "Credentials Updated." });
    } catch (error) {
        res.status(500).json({ message: "Error, Cannot update credentials." });
    };
};

//Delete a user credentials from the database
export const DeleteAuthority = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        await pool.query("DELETE FROM user WHERE id = ?", [id]);

        res.json({ message: "Delete successful." });
    } catch (error) {
        res.status(500).json({ message: "Error, Cannot delete." })
    };
}