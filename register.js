const oracledb = require('oracledb');
const express = require('express');
const bodyParser = require('body-parser');
const connectionModule = require('./connection');
const app = express();
app.use(bodyParser.json());
app.listen(4321); 
const path = require('path');
app.use(bodyParser.urlencoded({extended:true}));
app.set('view engine','ejs');


connectionModule.initializeConnection();

let queryid;

app.get('/Batigharsignup',async function(req,res){
   res.render('signup.ejs');

  

});


app.post('/Batigharsignup', async function (req, res) {
    const fname = req.body.fname;
    const lname = req.body.lname;
    const email = req.body.Email;
    const phoneNo = req.body.MobileNo;
    const bday = req.body.BirthDate;
    const password = req.body.password;
    const city = req.body.City;
    const postal_code = req.body.PostalCode;
    const road_no = req.body.RoadNo;


    try {
        const connection = await connectionModule.getConnection();

       
        const addressQuery = await connection.execute(
            "SELECT ADDRESS_ID FROM ADDRESS WHERE CITY = :city AND POSTAL_CODE = :postal_code AND ROAD_NUMBER = :road_no",
            { city: city, postal_code: postal_code, road_no: road_no },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        let addressId;

        if (addressQuery.rows.length === 0) {
          
       
            const lastAddressQuery = await connection.execute(
                "SELECT MAX(ADDRESS_ID) AS LAST_ADDRESS_ID FROM ADDRESS",
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            const lastAddressId = lastAddressQuery.rows[0].LAST_ADDRESS_ID || 0;
            addressId = lastAddressId + 1;
       
          
    
            await connection.execute(
                "INSERT INTO ADDRESS(ADDRESS_ID, CITY, POSTAL_CODE, ROAD_NUMBER) " +
                "VALUES (:addressId, :city, :postal_code, :road_no)",
                { addressId: addressId, city: city, postal_code: postal_code, road_no: road_no },
                { autoCommit: true }
            );
        } else {
           
            addressId = addressQuery.rows[0].ADDRESS_ID;
        }
       
     
        const result = await connection.execute(
            "INSERT INTO CUSTOMER(FIRST_NAME,LAST_NAME, PHONE_NO, EMAIL, BIRTH_DATE,PASSWORD, ADDRESS_ID) " +
            "VALUES (:fname,:lname, :phoneNo, :email, TO_DATE(:bday, 'YYYY-MM-DD'), :password,:addressId) ",
            { fname:fname,lname:lname,phoneNo:phoneNo,email:email,bday:bday,password:password, addressId: addressId },
            { autoCommit: true }
        );
    
        res.render('aftersignup', { message: 'Customer signup successful' });
        
    } catch (error) {
        res.status(500).send('Error inserting data');
    }finally{
        connectionModule.closeConnection();
    }
});


app.get('/Batigharlogin',async function(req,res){
    res.render('login.ejs');
 
 });



app.post('/Batigharlogin', async function (req, res){
    const email = req.body.Email;
    const password = req.body.password;
   

    try{

      const connection = await connectionModule.getConnection();
    
      const query = await connection.execute(
        "SELECT PASSWORD FROM CUSTOMER WHERE EMAIL = :email",
        {email : email },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }

      )

      if (query.rows.length === 0) {
        res.status(404).send('Invalid Login.Try again');
        return;
    }

    const storedPassword = query.rows[0].PASSWORD;
    
    if(storedPassword === password){
        res.send('Login Successful');
        //res.render('/homepage.ejs');
    }
    else{
        res.status(401).send('Invalid login.Try again')
    }

     
    }catch (error) {
        res.status(500).send('Error inserting data');
    }finally{
        connectionModule.closeConnection();
    }
});

app.get('/homepage',async function(req,res){
    res.render('homepage');
});
  

app.post('/identityconfirmation',async function(req,res){
    const redirectTo = req.body.redirectTo;

    if(redirectTo === '/Batigharsignup' || redirectTo === '/Batigharlogin' || redirectTo === '/Admin'){
        res.redirect(redirectTo);
    }else{
        res.status (400).send("Invalid redirect choice");
    }

});
app.post('/redirectingto',async function (req, res) {
    const redirectTo = req.body.redirectTo;

    if (redirectTo === '/Batigharlogin' || redirectTo === '/homepage') {
        res.redirect(redirectTo);
    } else {
        res.status(400).send('Invalid redirect choice');
    }
});


app.get('/Admin',async function(req,res){
     res.render('login');
});

app.post('/Admin',async function(req,res){
    const email = req.body.Email;
    const password = req.body.password;
   
         if(email === "batighar453@gmail.com" && password === "onlinebatighar7843"){
            res.render('AdminSection');
         }
         else{
            res.render('homepage',{message: "invalid credentials for Admin"});
         }
});


app.get('/AdminSection',async function(req,res){
      res.render('AdminSection');
     
});



app.get('/addBook',async function(req,res){
   res.render('addBookDetails');     
});

app.post('/addBookDetails' , async function(req,res){
    const isbn = req.body.isbn;
    const title = req.body.title;
    const pyear = req.body.Publicationyear;
    const language = req.body.language;
    const dimension = req.body.dimension;
    const weight = req.body.weight;
    const stocks = req.body.stocks;
    const price = req.body.price;
    const edition = req.body.edition;
    const authors = req.body.authors;
    const category = req.body.category;
     
    try {
        const connection = await connectionModule.getConnection();

        for (const authorName of authors) {
            
            const authorId = await getOrCreateAuthorId(connection, authorName);
            await connection.execute(
                "INSERT INTO BOOK_AUTHOR (ISBN, AUTHOR_ID) VALUES (:isbn, :authorId)",
                { isbn, authorId }
            );
        }

        for (const categories of category) {
            const categoryid = await getOrCreateCategoryId(connection, categories);

            await connection.execute(
                "INSERT INTO BOOK_CATEGORY (ISBN, CATEGORY_ID) VALUES (:isbn, :categoryid)",
                { isbn, categoryid}
            );
        }

       await connection.execute(
        "INSERT INTO BOOK (ISBN,TITLE,PUBLICATION_YEAR,EDITION,DIMENSION,WEIGHT,STOCKS,PRICE,LANGUAGE)"+
        "VALUES (:isbn,:title,:pyear,:edition,:dimension,:weight,:stocks,:price,:language)",
        {isbn,title,pyear,edition,dimension,weight,stocks,price,language}
       );

       res.render('publication',{message:"Publication Details"});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding book.');
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
        return result.rows[0].AUTHOR_ID;
    } else {

        try {
            const connection = await connectionModule.getConnection();
        const lastCID = await connection.execute(
            "SELECT MAX(AUTHOR_ID) AS LAST_AUTHOR_ID FROM AUTHOR",
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
    
        const lastID = lastwriterID.rows[0].LAST_AUTHOR_ID || 0;
        ID = lastID + 1;
    
      
    
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
        ID = lastID + 1;
    
      
    
        await connection.execute(
            "INSERT INTO CATEGORY(CATEGORY_ID, NAME) " +
            "VALUES (:CATEGORY_ID, :NAME)",
            { ID: ID, name:categoryName},
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


app.post('/publication',async function(req,res){
    const name = req.body.name;
    const email = req.body.email;
    const title = req.body.title;
    try{
      const connection = await connectionModule.getConnection();

     
      const result= await connection.execute(
          "SELECT NAME, PUBLISHER_ID FROM PUBLISHER WHERE NAME = :name AND EMAIL = :email",
          { name : name, email: email},
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      if(result.rows.length === 0){
           res.render('publicationDetails',{message: "The publisher is new.Put publisher details first"});
      }

      else{
          const id = result.rows[0].PUBLISHER_ID;
          await connection.execute(
              "UPDATE BOOK SET PUBLISHER_ID = :id WHERE TITLE = :title",
              { id: id, title:title }
          );
          
        res.render('addBookDetails',{messages:"Book added successfully!Want to add more book"});
      }
    }catch (error) {
      res.status(500).send('Error inserting data');
  }finally{
      connectionModule.closeConnection();
  }
});

app.post('/publicationDetails',async function(req,res){
    const name = req.body.name;
    const email = req.body.Email;
    const city = req.body.City;
    const postal_code = req.body.PostalCode;
    const road_no = req.body.RoadNo;

    try {
        const connection = await connectionModule.getConnection();

       
        const addressQuery = await connection.execute(
            "SELECT ADDRESS_ID FROM ADDRESS WHERE CITY = :city AND POSTAL_CODE = :postal_code AND ROAD_NUMBER = :road_no",
            { city: city, postal_code: postal_code, road_no: road_no },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        let addressId;

        if (addressQuery.rows.length === 0) {
          
       
            const lastAddressQuery = await connection.execute(
                "SELECT MAX(ADDRESS_ID) AS LAST_ADDRESS_ID FROM ADDRESS",
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            const lastAddressId = lastAddressQuery.rows[0].LAST_ADDRESS_ID || 0;
            addressId = lastAddressId + 1;
       
          
    
            await connection.execute(
                "INSERT INTO ADDRESS(ADDRESS_ID, CITY, POSTAL_CODE, ROAD_NUMBER) " +
                "VALUES (:addressId, :city, :postal_code, :road_no)",
                { addressId: addressId, city: city, postal_code: postal_code, road_no: road_no },
                { autoCommit: true }
            );
        } else {
           
            addressId = addressQuery.rows[0].ADDRESS_ID;
        } const result = await connection.execute(
            "INSERT INTO PUBLISHER(NAME, EMAIL,  ADDRESS_ID) " +
            "VALUES (:name,::email,:addressId) ",
            { name:name,email:email,addressId: addressId },
            { autoCommit: true }
        );
    
        res.render('publications');
        
    } catch (error) {
        res.status(500).send('Error inserting data');
    }finally{
        connectionModule.closeConnection();
    }
       
});




app.get('/addMoreCopies',async function(req,res){
    res.render('addMoreCopies');     
 });

 app.post('/addMoreCopies', async function (req,res){
    const Title = req.body.title;

    try {
        const connection = await connectionModule.getConnection();

       
        const resultS = await connection.execute(
            "SELECT * FROM BOOK WHERE TITLE = :title ",
            { title: title},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (resultS.rows.length === 0) {
            res.redirect('addMoreCopies',{message: "No such book exist in your database"});
       }
   
     else{
        const result = await connection.execute(
            "SELECT B.*, A.NAME AS AUTHOR_NAME " +
            "FROM AUTHOR A " +
            "JOIN BOOK_AUTHOR BA ON A.AUTHOR_ID = BA.AUTHOR_ID " +
            "JOIN BOOK B ON BA.ISBN = B.ISBN " +
            "WHERE B.ISBN = :isbn",
            { isbn },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

    
        const bookDetails = {
            isbn: result.rows[0].ISBN,
            title: result.rows[0].TITLE,
            price: result.rows[0].PRICE,
            category: result.rows[0].CATEGORY,
            weight: result.rows[0].WEIGHT,
            dimension:result.rows[0].dimension,
            edition: result.rows[0].EDITION,
            publication_year:result.rows[0].PUBLICATION_YEAR,
            language:result.rows[0].LANGUAGE,
            stocks:result.rows[0].STOCKS,
            authors: result.rows.map(row => row.AUTHOR_NAME)
        };

       
        res.render('bookDetails', { book: bookDetails });
    }
    }catch(error){
        res.status(500).send('Error inserting data');
    }finally{
        connectionModule.closeConnection();
    }

   
 })

 app.post('/bookDetails',async function(req,res){
         const stocks = req.body.stocks;
         const price = req.body.price;
         const title = req.body.title;

         try{
         const connection = await connectionModule.getConnection();

         await connection.execute(
            "UPDATE BOOK  SET STOCKS = :stocks, PRICE = :price, WHERE TITLE = :title",
            { stocks: stocks, price: price },
            { autoCommit: true }
        );

    
         }catch (error) {
            res.status(500).send('Error updating data');
        }finally{
            connectionModule.closeConnection();
        }

        res.redirect('bookDetails',{message: "Update successfully"});
 });
 
app.get('/Weeksell', async (req, res) => {
    try {
        const connection = await connectionModule.getConnection();

        const result = await connection.execute(
            `SELECT SUM(
                CASE
                    WHEN CH.DISCOUNT IS NOT NULL THEN CH.BASE_PRICE - (CH.BASE_PRICE * CH.DISCOUNT / 100)
                    ELSE CH.BASE_PRICE
                END
            ) AS TOTAL_SALES
            FROM CART_HISTORY CH
            JOIN "ORDER" O ON CH.CART_ID = O.CART_ID
            WHERE TO_CHAR(O.ORDER_DATE, 'YYYY-MM-DD') >= TO_CHAR(TRUNC(SYSDATE, 'IW') - 7, 'YYYY-MM-DD')
              AND TO_CHAR(O.ORDER_DATE, 'YYYY-MM-DD') < TO_CHAR(TRUNC(SYSDATE, 'IW'), 'YYYY-MM-DD')`
        );

        const totalSales = result.rows[0].TOTAL_SALES;

        res.render('Weeksell',{totalSales});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching total sales');
    } finally {
        connectionModule.closeConnection();
    }
});




app.get('/Monthsell', async (req, res) => {
    try {
        const connection = await connectionModule.getConnection();

        const result = await connection.execute(
            `SELECT SUM(
                CASE
                    WHEN CH.DISCOUNT IS NOT NULL THEN CH.BASE_PRICE - (CH.BASE_PRICE * CH.DISCOUNT / 100)
                    ELSE CH.BASE_PRICE
                END
            ) AS TOTAL_SALES
            FROM CART_HISTORY CH
            JOIN "ORDER" O ON CH.CART_ID = O.CART_ID
            WHERE TO_CHAR(O.ORDER_DATE, 'YYYY-MM') = TO_CHAR(SYSDATE, 'YYYY-MM')`
        );

        const totalSales = result.rows[0].TOTAL_SALES;

        res.render('Monthsell', { totalSales });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching total sales');
    } finally {
        connectionModule.closeConnection();
    }
});

app.get('/BestSellingBooksOfMonth', async (req, res) => {
    try {
        const connection = await connectionModule.getConnection();

        const result = await connection.execute(
            `SELECT B.ISBN, B.TITLE, SUM(
                CASE
                    WHEN CH.DISCOUNT IS NOT NULL THEN CH.BASE_PRICE - (CH.BASE_PRICE * CH.DISCOUNT / 100)
                    ELSE CH.BASE_PRICE
                END
            ) AS TOTAL_SALES
            FROM CART_HISTORY CH
            JOIN "ORDER" O ON CH.CART_ID = O.CART_ID
            JOIN BOOK B ON CH.ISBN = B.ISBN
            WHERE TO_CHAR(O.ORDER_DATE, 'YYYY-MM') = TO_CHAR(SYSDATE, 'YYYY-MM')
            GROUP BY B.ISBN, B.TITLE
            ORDER BY TOTAL_SALES DESC`
        );

        if (result.rows.length > 0) {
            const bestSellingBooks = result.rows.map(row => ({
                isbn: row.ISBN,
                title: row.TITLE,
                totalSales: row.TOTAL_SALES,
            }));

            res.render('BestSellingBooksOfMonth', { bestSellingBooks });
        } else {
            res.render('BestSellingBooksOfMonth', { message: 'No sales data available for the current month.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching best-selling books of the month');
    } finally {
        connectionModule.closeConnection();
    }
});

 
 
 
 

 

