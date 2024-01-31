
app.post('/addCopies', async (req, res) => {
    const isbn = req.body.isbn;
    const title = req.body.title;
    const category = req.body.category;
    const pyear = req.body.Publicationyear;
    const language = req.body.language;
    const dimension = req.body.dimension;
    const weight = req.body.weight;
    const stocks = req.body.stocks;
    const price = req.body.price;
    const edition = req.body.edition;
     
    // Insert copies into the BOOK table

    // Insert authors into the BOOK_AUTHOR table
    try {
        const connection = await connectionModule.getConnection();

        for (const authorName of authors) {
            // Check if the author already exists, if not, insert it
            // Get the author ID or insert a new author and get the ID
            const authorId = await getOrCreateAuthorId(connection, authorName);

            // Insert into BOOK_AUTHOR table
            await connection.execute(
                "INSERT INTO BOOK_AUTHOR (ISBN, AUTHOR_ID) VALUES (:isbn, :authorId)",
                { isbn, authorId }
            );
        }

        res.send('Copies and authors added successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding copies and authors.');
    } finally {
        connectionModule.closeConnection();
    }
});


async function getOrCreateAuthorId(connection, authorName) {
    const result = await connection.execute(
        "SELECT AUTHOR_ID FROM AUTHOR WHERE NAME = :authorName",
        { authorName },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
        // Author already exists, return the existing ID
        return result.rows[0].AUTHOR_ID;
    } else {
        // Author does not exist, insert a new author and return the new ID
        const insertResult = await connection.execute(
            "INSERT INTO AUTHOR (NAME) VALUES (:authorName) RETURNING AUTHOR_ID INTO :newId",
            { authorName, newId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } }
        );

        return insertResult.outBinds.newId[0];
    }
}
