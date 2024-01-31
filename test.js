
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

        for (const categories of category) {
            // Check if the author already exists, if not, insert it
            // Get the author ID or insert a new author and get the ID
            const categoryid = await getOrCreateCategoryId(connection, categories);

            // Insert into BOOK_AUTHOR table
            await connection.execute(
                "INSERT INTO BOOK_CATEGORY (ISBN, CATEGORY_ID) VALUES (:isbn, :categoryid)",
                { isbn, categoryid}
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

        try {
            const connection = await connectionModule.getConnection();
        const lastwriterID = await connection.execute(
            "SELECT MAX(AUTHOR_ID) AS LAST_AUTHOR_ID FROM AUTHOR",
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
    
        const lastID = lastwriterID.rows[0].LAST_AUTHOR_ID || 0;
        ID = lastwriterID + 1;
    
      
    
        await connection.execute(
            "INSERT INTO AUTHOR(AUTHOR_ID, NAME) " +
            "VALUES (:AUTHOR_ID, :NAME)",
            { ID: ID, name:authorName},
            { autoCommit: true }
        );

        return ID;
    
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding copies and authors.');
    } finally {
        connectionModule.closeConnection();
    }
}
}

async function getOrCreateCategoryId(connection, categoryName) {
    const result = await connection.execute(
        "SELECT CATEGORY_ID FROM CATEGORY WHERE NAME = :categoryName",
        { categoryName },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length > 0) {
        // Author already exists, return the existing ID
        return result.rows[0].CATEGORY_ID;
    } else {

        try {
            const connection = await connectionModule.getConnection();
        const lastCID = await connection.execute(
            "SELECT MAX(CATEGORY_ID) AS LAST_CATEGORY_ID FROM CATEGORY",
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
    
        const lastID = lastCID.rows[0].LAST_CATEGORY_ID || 0;
        ID = lastCID + 1;
    
      
    
        await connection.execute(
            "INSERT INTO CATEGORY(CATEGORY_ID, NAME) " +
            "VALUES (:CATEGORY_ID, :NAME)",
            { ID: ID, name:authorName},
            { autoCommit: true }
        );

        const lastSID = await connection.execute(
            "SELECT MAX(SUBCATEGORY_ID) AS LAST_SUBCATEGORY_ID FROM CATEGORY",
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
    
        const lastid = lastSID.rows[0].LAST_CATEGORY_ID || 0;
        id = lastSID + 1;
    
      
    
        await connection.execute(
            "INSERT INTO SUBCATEGORY(CATEGORY_ID, SUBCATEGORY_ID) " +
            "VALUES (:CATEGORY_ID, :SUBCATEGORY_ID)",
            {ID:ID ,id:id},
            { autoCommit: true }
        );

        /*await connection.execute(
            "INSERT INTO SUBCATEGORYDETAILS(SUBCATEGORY_ID, SUBCATEGORY_ID) " +
            "VALUES (:CATEGORY_ID, :SUBCATEGORY_ID)",
            {ID:ID ,id:id},
            { autoCommit: true }
        );*/


        return ID;
    
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding copies and authors.');
    } finally {
        connectionModule.closeConnection();
    }
}
}