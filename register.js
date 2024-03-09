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
const session = require('express-session');
const crypto = require('crypto');
const { Console } = require('console');
const { type } = require('os');
const connection = require('./connection');
const { start } = require('repl');
const secretKey = crypto.randomBytes(32).toString('hex');

app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false
}));


var customerid;




connectionModule.initializeConnection();


app.get('/Batigharsignup',async function(req,res){
   res.render('signup.ejs');

});

app.get('/contact2', async function(req,res){
    res.render('contact2');
})

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
    const home_no = req.body.HomeNo;

    


    try {
        const connection = await connectionModule.getConnection();

        console.log("inserted1 succesfully");
        const addressQuery = await connection.execute(
            "SELECT ADDRESS_ID FROM ADDRESS WHERE CITY = :city AND POSTAL_CODE = :postal_code AND ROAD_NUMBER = :road_no AND HOME_NUMBER = :home_no",
            { city: city, postal_code: postal_code, road_no: road_no ,home_no: home_no},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
      

        let addressId;
   

        if (addressQuery.rows.length === 0) {
          const add = await connection.execute(
            "INSERT INTO ADDRESS(CITY , POSTAL_CODE , ROAD_NUMBER , HOME_NUMBER)" +
            "VALUES(:city, :postal_code,:road_no , :home_no)",
            {city: city ,postal_code:postal_code,road_no:road_no,home_no:home_no },
            {autoCommit :true}
          );
           

          console.log("inserted succesfully");


          const getid = await connection.execute(
            "SELECT ADDRESS_ID FROM ADDRESS WHERE CITY = :city AND POSTAL_CODE = :postal_code AND ROAD_NUMBER = :road_no AND HOME_NUMBER = :home_no",
            { city: city, postal_code: postal_code, road_no: road_no ,home_no: home_no},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
            addressId = getid.rows[0].ADDRESS_ID;
            console.log(addressId);
          
        } else {
           
            addressId = addressQuery.rows[0].ADDRESS_ID;
            console.log(addressId);
        }
       
     
        const result = await connection.execute(
            "INSERT INTO CUSTOMER(FIRST_NAME,LAST_NAME,BIRTH_DATE,PHONE_NO, ADDRESS_ID,  EMAIL, PASSWORD) " +
            "VALUES (:fname,:lname, TO_DATE(:bday, 'YYYY-MM-DD'),:phoneNo, :addressId ,:email, :password) ",
            { fname:fname,lname:lname,bday:bday,phoneNo:phoneNo, addressId: addressId ,email:email,password:password},
            { autoCommit: true }
        );
    
        res.render('StartPage', { message: 'Customer signup successful.Log In now' });
        
    } catch (error) {
        res.status(500).send('Error inserting data');
    }
});


app.get('/Batigharlogin',async function(req,res){
    res.render('login.ejs');
 
 });



app.post('/Batigharlogin', async function (req, res){
    const email = req.body.Email;
    const password = req.body.password;
    console.log(email);
   

    try{

      const connection = await connectionModule.getConnection();
    
      const query = await connection.execute(
        "SELECT CUSTOMER_ID,PASSWORD FROM CUSTOMER WHERE EMAIL = :email",
        {email : email },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }

      )

      if (query.rows.length === 0) {
        res.render('StartPage', { message: 'Wrong Credentials' });
        return;
    }

    const storedPassword = query.rows[0].PASSWORD;
    console.log(storedPassword);
    
    if(storedPassword === password){
        customerid = query.rows[0].CUSTOMER_ID;
        console.log(customerid);
        res.render('homepage',{message : 'Login Successful'});
    }
    else{
        res.status(401).send('Invalid login.Try again')
    }

     
    }catch (error) {
        res.status(500).send('Error inserting data');
    }
});

app.get('/Startpage',async function(req,res){
    res.render('Startpage');
});

app.get('/about',async function(req,res){
   res.render('about');
});

app.get('/contact',async function(req,res){
    res.render('contact');
 });
  

app.get('homepage',async function(req,res){
   res.render('homepage');
});



app.get('/Admin',async function(req,res){
     res.render('login');
});

app.get('/Profile',async function(req,res){
   res.render('Profile');
});

app.post('/Admin',async function(req,res){
    const email = req.body.Email;
    const password = req.body.password;
   
         if(email === "batighar453@gmail.com" && password === "123456"){
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
   res.render('addBook');     
});

app.post('/addBook' , async function(req,res){


    const { isbn, title, pyear, language, dimension, weight, stocks, price, edition,publisher_name, category, authors,cover_photo } = req.body;
      console.log(req.body);

    const categoriesArray = category.split(',');
  
    const authorsArray = authors.split(',');
    console.log('Categories:', categoriesArray);
    console.log('Authors:', authorsArray);
    try {
        const connection = await connectionModule.getConnection();

        var pid;
        const pq = await connection.execute(
            "SELECT PUBLISHER_ID FROM PUBLISHER WHERE UPPER(NAME) = UPPER(:publisher_name)",
            {publisher_name:publisher_name},
            { outFormat: oracledb.OUT_FORMAT_OBJECT}
        );

        if(pq.rows.length){
               pid = pq.rows[0].PUBLISHER_ID;
        }

        await connection.execute(
            "INSERT INTO BOOK (ISBN,TITLE,PUBLICATION_YEAR,EDITION,DIMENSION,WEIGHT,STOCK,PRICE,LANGUAGE,PUBLISHER_ID,COVER_PHOTO)"+
            "VALUES (:isbn,:title,:pyear,:edition,:dimension,:weight,:stocks,:price,:language,:pid,:cover_photo)",
            {isbn:isbn,title:title,pyear:pyear,edition:edition,dimension:dimension,weight:weight,stocks:stocks,price:price,language:language,pid:pid,cover_photo:cover_photo},
            {autoCommit :true}
           );
     

        for (const categories of categoriesArray) {
   

           var id;
           
            const result = await connection.execute(
                "SELECT CATEGORY_ID FROM CATEGORY WHERE UPPER(NAME) = UPPER(:categories)",
                { categories:categories },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
        
            if (result.rows.length > 0) {
              id =  result.rows[0].CATEGORY_ID;
            } else {
        
                    const qu = await connection.execute(
                        "SELECT MAX(CATEGORY_ID) AS ID FROM CATEGORY",
                        {outFormat:oracledb.OUT_FORMAT_OBJECT}
                    );
                  
                    id = qu.rows[0].ID + 1;
                    console.log(id);
                    await connection.execute(
                        "INSERT INTO CATEGORY(CATEGORY_ID,NAME) VALUES (:id,:categories)",
                        { id:id,categories: categories },
                        { autoCommit: true }
                    );
        
                    
                }   
    
              
            await connection.execute(
                "INSERT INTO BOOK_CATEGORY (ISBN, CATEGORY_ID) VALUES (:isbn, :id)",
                { isbn:isbn, id:id},
                {autoCommit :true}
            );

        }
        
        for (const author of authorsArray) {
   

            var id;
            
             const result = await connection.execute(
                 "SELECT AUTHOR_ID FROM AUTHOR WHERE UPPER(NAME) = UPPER(:author)",
                 { author:author },
                 { outFormat: oracledb.OUT_FORMAT_OBJECT }
             );
         
             if (result.rows.length > 0) {
               id =  result.rows[0].AUTHOR_ID;
               console.log(id);
             } else {
         
                 try {
                      
                     const qu = await connection.execute(
                         "SELECT MAX(AUTHOR_ID) AS ID FROM AUTHOR",
                         {outFormat:oracledb.OUT_FORMAT_OBJECT}
                     );
                   
                     id = qu.rows[0].ID + 1;
                     console.log(id);
                     await connection.execute(
                         "INSERT INTO AUTHOR(AUTHOR_ID,NAME) VALUES (:id,:author)",
                         { id:id,author:author },
                         { autoCommit: true }
                     );
         
                     }catch(error){
                         console.log(error);
                     }
                 }   
     
               
             await connection.execute(
                 "INSERT INTO BOOK_AUTHOR (ISBN, AUTHOR_ID) VALUES (:isbn, :id)",
                 { isbn:isbn, id:id},
                 {autoCommit :true}
             );
 
         }
         

       
       res.render('AdminSection',{message:'book added successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding book.');
    }   
});




app.get('/addMoreCopies', async function(req, res) {
    res.render('addMoreCopies');
});

app.post('/addMoreCopies', async function(req, res) {
    const title = req.body.title;

    try {
        const connection = await connectionModule.getConnection();

        const resultS = await connection.execute(
            "SELECT * FROM BOOK WHERE TITLE = :title",
            { title: title },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (resultS.rows.length === 0) {
            return res.render('addMoreCopies', { message: "No such book exists in your database" });
        }

        const isbn = resultS.rows[0].ISBN;

        const result = await connection.execute(
            "SELECT B.*, A.NAME AS AUTHOR_NAME " +
            "FROM AUTHOR A " +
            "JOIN BOOK_AUTHOR BA ON A.AUTHOR_ID = BA.AUTHOR_ID " +
            "JOIN BOOK B ON BA.ISBN = B.ISBN " +
            "WHERE B.ISBN = :isbn",
            { isbn },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const categoriesResult = await connection.execute(
            "SELECT C.NAME AS CATEGORYNAME " +
            "FROM CATEGORY C " +
            "JOIN BOOK_CATEGORY BC ON C.CATEGORY_ID = BC.CATEGORY_ID " +
            "WHERE BC.ISBN = :isbn",
            { isbn }
        );

        const book = {
            isbn: result.rows[0].ISBN,
            title: result.rows[0].TITLE,
            price: result.rows[0].PRICE,
            weight: result.rows[0].WEIGHT,
            photo:result.rows[0].COVER_PHOTO,
            dimension: result.rows[0].DIMENSION,
            edition: result.rows[0].EDITION,
            publication_year: result.rows[0].PUBLICATION_YEAR,
            language: result.rows[0].LANGUAGE,
            stock: result.rows[0].STOCK,
            authors: result.rows.map(row => ({ AUTHOR_NAME: row.AUTHOR_NAME })),
            categories: categoriesResult.rows.map(row => ({ CATEGORYNAME: row.CATEGORYNAME }))
        };

        res.render('bookDetails', { book: book });
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).send('Error fetching book details');
    } 
});

// Route for updating book details
app.post('/bookDetails', async function(req, res) {
    const { Stocks, Price, Title } = req.body;
    console.log(req.body);

    try {
        const connection = await connectionModule.getConnection();
        console.log('haha');

        const q = await connection.execute(
            "UPDATE BOOK SET STOCK = :Stocks, PRICE = :Price WHERE TITLE = :Title",
            { Stocks: Stocks, Price: Price, Title:Title },
            { autoCommit: true }
        );
        console.log('haha');
      
        res.render('AdminSection', { message: "Update successful" });
    } catch (error) {
        console.error('Error updating book details:', error);
        res.status(500).send('Error updating book details');
    } 
});


app.get('/Report',async function(req,res){
         res.render('Report');

});
app.get('/topPublishers', async function(req, res) {
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
        `BEGIN
        top_10_publishers;
        END;`
           
        );

        const result = await connection.execute(
           "SELECT * FROM TOP_PUBLISHERS",
           
        );
      
        console.log("Stored procedure executed successfully");
        const qq = result.rows;
        res.render('topPublisher_byCount',{qq:qq});
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});


app.get('/topPublishers_sales', async function(req, res) {
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
        `BEGIN
        top_10_publishers_sales;
        END;`
           
        );

        const result = await connection.execute(
           "SELECT * FROM TOP_PUBLISHERS_SALES",
           
        );
      
        console.log("Stored procedure executed successfully");
        const qq = result.rows;
        res.render('topPublisher_bySales',{qq:qq});
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});


app.get('/topAuthors', async function(req, res) {
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
        `BEGIN
        top_10_authors;
        END;`
           
        );

        const result = await connection.execute(
           "SELECT * FROM TOP_AUTHORS",
           
        );
      
        console.log("Stored procedure executed successfully");
        const qq = result.rows;
        res.render('topAuthors_byCount',{qq:qq});
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});



app.get('/topAuthors_sales', async function(req, res) {
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
        `BEGIN
        top_10_authors_sales;
        END;`
           
        );

        const result = await connection.execute(
           "SELECT * FROM TOP_AUTHORS_SALES",
           
        );
      
        console.log("Stored procedure executed successfully");
        const qq = result.rows;
        res.render('topAuthors_bySales',{qq:qq});
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});



app.get('/topCustomers', async function(req, res) {
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
        `BEGIN
        top_10_customers_sales;
        END;`
           
        );

        const result = await connection.execute(
           "SELECT * FROM TOP_CUSTOMERS_SALES",
           
        );
      
        console.log("Stored procedure executed successfully");
        const qq = result.rows;
        res.render('topCustomers',{qq:qq});
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});

app.get('/BookSell',async function(req,res){
   res.render('BookSell');
});



app.get('/topBook', async function(req, res) {
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
        `BEGIN
        top_10_book;
        END;`
           
        );

        const result = await connection.execute(
           "SELECT * FROM TOP_BOOKS_SALES",
           
        );
      
        console.log("Stored procedure executed successfully");
        const qq = result.rows;
        res.render('topbook_byCount',{qq:qq});
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});




app.get('/topBook_sales', async function(req, res) {
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
        `BEGIN
        top_10_book_sales;
        END;`
           
        );

        const result = await connection.execute(
           "SELECT * FROM TOP_BOOKS",
           
        );
      
        console.log("Stored procedure executed successfully");
        const qq = result.rows;
        res.render('topbook_bySales',{qq:qq});
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});

app.get('/monthly_gross',async function(req,res){
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
       `BEGIN
       monthly_gross_sales;
         END;`
        );

        const result = await connection.execute(
           "SELECT TO_CHAR(TO_DATE(month_year, 'YYYY-MM'), 'Month,YYYY') AS ConvertedDate , total_sales,total_books,total_copies FROM monthly_gross"
           
        );
      
        console.log("Stored procedure executed successfully");
        if(result.rows.length){
        const qq = result.rows;
        console.log(qq);
        res.render('monthly_gross',{qq:qq});
        }
      
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});




///customer search

app.get('/homepage' , async function(req,res){
    res.render('homepage');
});

app.get('/profileOFCustomer' ,async function(req,res){
       try{
           const connection = connectionModule.getConnection();

           const qq = await connection.execute(
             "SELECT * FROM CUSTOMER WHERE CUSTOMER_ID = :customerid",
             {customerid:customerid}
           );

          if(qq.rows.length){
           const p = qq.rows[0];
           console.log(p);
           res.render('profileOFCustomer', {p :p});
          }
       }catch(error){
           console.log(error);
       }
});

app.get('/BrowseProduct' , async function(req,res){
   

    try {
        const connection = await connectionModule.getConnection();

        const q = await connection.execute(
            "SELECT * FROM (SELECT * FROM BOOK) WHERE ROWNUM <= 48"

        );
         const books = q.rows;
         res.render('BrowseProduct', { books: books });
     } catch (error) {
         console.error("Error fetching books:", error);
         res.status(500).send("Error fetching books. Please try again later.");
     }
    
});




app.get('/bookDetailsforcustomer/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    console.log(isbn);

    try {
        const connection = await connectionModule.getConnection();

        const result = await connection.execute(
            "SELECT B.*, A.NAME AS AUTHOR_NAME " +
            "FROM AUTHOR A " +
            "JOIN BOOK_AUTHOR BA ON A.AUTHOR_ID = BA.AUTHOR_ID " +
            "JOIN BOOK B ON BA.ISBN = B.ISBN " +
            "WHERE B.ISBN = :isbn",
            { isbn },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        const categoriesResult = await connection.execute(
            "SELECT C.NAME AS CATEGORYNAME " +
            "FROM CATEGORY C " +
            "JOIN BOOK_CATEGORY BC ON C.CATEGORY_ID = BC.CATEGORY_ID " +
            "WHERE BC.ISBN = :isbn",
            { isbn }
        );
        console.log(result.rows[0]);
        const book = {
            isbn: result.rows[0].ISBN,
            title: result.rows[0].TITLE,
            price: result.rows[0].PRICE,
            weight: result.rows[0].WEIGHT,
            photo:result.rows[0].COVER_PHOTO,
            dimension: result.rows[0].DIMENSION,
            edition: result.rows[0].EDITION,
            publication_year: result.rows[0].PUBLICATION_YEAR,
            language: result.rows[0].LANGUAGE,
            authors: result.rows.map(row => ({ AUTHOR_NAME: row.AUTHOR_NAME })),
            categories: categoriesResult.rows.map(row => ({ CATEGORYNAME: row.CATEGORYNAME }))
        };

        res.render('bookDetailsforcustomer', { book: book });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching book details');
    } 
});



// Modify the form for writing a review

app.get('/WriteReview/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    res.render('WriteReview', { isbn : isbn });
});


app.post('/WriteReview/:isbn', async function(req,res){
 
    const isbn = req.params.isbn;
    const reviewContent = req.body.reviewContent;
    const rating = req.body.rating;
    console.log(req.body);
    

    try {
        const connection = await connectionModule.getConnection();

        // Insert the review into the database
       
        await connection.execute(
            "INSERT INTO REVIEW (ISBN, CUSTOMER_ID, REVIEW_BODY,RATING) VALUES (:isbn, :customerid, :reviewContent,:rating)",
            { isbn: isbn, customerid: customerid, reviewContent: reviewContent,rating:rating }
        );

        console.log('haha');
      
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Error submitting review');
    } 
});



//read review

app.get('/SeeReviews/:isbn',async function(req,res){
    
    const isbn = req.params.isbn;

    try {
        const connection = await connectionModule.getConnection();

        const result = await connection.execute(
            `SELECT R.*
             FROM REVIEW R
             JOIN BOOK B ON R.ISBN = B.ISBN
             WHERE B.ISBN = :isbn`,
            {isbn : isbn}
          );

       if(result.rows.length){
         const reviews = result.rows;
         res.render('SeeReviews',{reviews});
       }else{
        res.render('SeeReviews',{message : 'no reviews given yet'});
    }


    } catch (error) {
        console.error(error);
        res.status(500).send('Error retriving review');
    } finally {
        connectionModule.closeConnection();
    }

});




app.get('/promo/:isbn',async function(req,res){
       isbn = req.params.isbn;
       console.log('haha1');
       console.log(isbn);

       try {
        const connection = await connectionModule.getConnection();

        const result = await connection.execute(
            `SELECT OH.ISBN, O.PROMOCODE,O.DISCOUNT
            FROM OFFER_HISTORY OH
            JOIN OFFER O ON OH.OFFER_ID = O.OFFER_ID
            WHERE OH.ISBN = :isbn`,
            {isbn : isbn}
          );

       if(result.rows.length){
         const q = result.rows[0];
         res.render('promo', {q:q});
       }else{
        res.render('failureMessage',{message : 'no promocode is available'});
    }


    } catch (error) {
        console.error(error);
        res.status(500).send('Error retriving promo');
    }

});

app.get('/addtocart/:isbn', async function(req, res) {
    const isbn = req.params.isbn;
    console.log(isbn);
    res.render('addtocart', { isbn: isbn});
});


app.post('/addtocart',async function(req,res){
     const isbn = req.body.isbn;
     const copies = parseInt(req.body.copies); 
     const promo = req.body.promo;
     console.log(req.body);
      
      var discount ; 
     // const customerid = 1;
      var active_cart;

      try{
        const connection = await connectionModule.getConnection();

      //  await connection.beginTransaction();

     // await connection.execute("BEGIN");
         
        /*await connection.execute(
            'SELECT * FROM BOOK WHERE ISBN = :isbn FOR UPDATE',
            { isbn: isbn },
            { autoCommit: false }
        );*/



        const pq = await connection.execute(
            `SELECT CART_ID FROM SHOPPING_CART WHERE CUSTOMER_ID = :customerid AND YET_TO_CONFIRM = 1`,
            {customerid:customerid}
      );

       
      if(pq.rows.length){
             active_cart = pq.rows[0].CART_ID;
             console.log(active_cart);
      }else{


        const confirm = 1;

         const b = await connection.execute(
            "SELECT MAX(CART_ID) AS ID  FROM SHOPPING_CART"        
         );

         active_cart = b.rows[0].ID + 1;
         console.log(active_cart);
         console.log(customerid);

        await connection.execute(
          "INSERT INTO SHOPPING_CART(CART_ID,CUSTOMER_ID,YET_TO_CONFIRM)VALUES(:active_cart,:customerid , 1)",
          {active_cart:active_cart,customerid:customerid},
          {autoCommit:true}
        );

       
      }

      console.log(active_cart);

      var price;

      const q1 = await connection.execute(
           `SELECT PRICE FROM BOOK WHERE ISBN = :isbn`,
           {isbn:isbn}
      );

      if(q1.rows.length){
             price = q1.rows[0].PRICE;
      }

 
          
    const { rows } = await connection.execute(
        'SELECT validate_cart(:active_cart,:isbn,:copies,:price) AS ISVALID FROM DUAL',{
            active_cart: active_cart,
            isbn: isbn,
            copies: copies,
            price: price
        });

        const isValid = rows[0].ISVALID;
        console.log(isValid);
    
    
    

  
    if(isValid){
    
            if(promo){
            const  qq = await connection.execute(
                `SELECT O.*
                FROM OFFER O
                JOIN OFFER_HISTORY OH ON O.OFFER_ID = OH.OFFER_ID
                WHERE O.PROMOCODE = :promo
                    AND O.START_DATE <= SYSDATE 
                    AND O.EXPIRED_DATE >= SYSDATE
                    AND OH.ISBN = :isbn`,
                    {promo:promo , isbn:isbn}
            );

            if(qq.rows.length){
                console.log(qq.rows[0]);
                discount = qq.rows[0].DISCOUNT;
                const id = qq.rows[0].OFFER_ID;

               
                const pp = await connection.execute(
                   `SELECT COUNT(*) AS offer_usage
                   FROM CART_HISTORY ch
                   JOIN SHOPPING_CART sc ON ch.CART_ID = sc.CART_ID
                   WHERE ch.OFFER_ID = :id AND ch.CART_ID != :active_cart AND sc.CUSTOMER_ID = :customerid`,
                   {id:id , active_cart:active_cart, customerid:customerid}

                );

                if(pp.rows.length){
                    const p = pp.rows[0].OFFER_USAGE;
                    if(p > 0){
                        console.log("succcess!!!!!!!!!!!");
                        res.render('failureMessage',{message : "Sorry!! You have applied for this offer before"})
                        return;
                    }
                }
                  
               
                await connection.execute(
                    "INSERT INTO CART_HISTORY(ISBN,CART_ID,NUMBER_OF_COPY,BASE_PRICE,DISCOUNT,OFFER_ID)"+
                    "VALUES(:isbn,:active_cart,:copies,:price,:discount,:id)",
                    {isbn:isbn , active_cart:active_cart,copies:copies ,price:price,discount:discount,id:id },
                    {autoCommit:true}
                );

            }else{
                res.render('failureMessage' , {message: "The promocode is not active right now"});
                return;
            }
        }

        else{
                await connection.execute(
                    "INSERT INTO CART_HISTORY(ISBN,CART_ID,NUMBER_OF_COPY,BASE_PRICE)"+
                    "VALUES(:isbn,:active_cart,:copies,:price)",
                    {isbn:isbn , active_cart:active_cart,copies:copies ,price:price},
                    {autoCommit:true}
                );

                
            }
              
   
           
            

             const totalItemQuery =await connection.execute(
             `SELECT SUM(NUMBER_OF_COPY) AS total_items
             FROM CART_HISTORY
             WHERE CART_ID = :active_cart`,
             {active_cart:active_cart}
             );

            const totalPriceQuery = await connection.execute(
            `SELECT SUM(NUMBER_OF_COPY *(BASE_PRICE - BASE_PRICE*NVL(DISCOUNT/100,0))) AS total_price
            FROM CART_HISTORY
            WHERE CART_ID = :active_cart`,
            {active_cart : active_cart}
            );

           const totalPrice = totalPriceQuery.rows[0].TOTAL_PRICE;
           const totalitem = totalItemQuery.rows[0].TOTAL_ITEMS;
           console.log(totalPrice);
           console.log(totalitem);

              
            await connection.execute(
                  "UPDATE SHOPPING_CART SET TOTAL_PRICE = :totalPrice , TOTAL_ITEM = :totalitem  WHERE CART_ID = :active_cart",
                  {totalPrice:totalPrice , totalitem:totalitem, active_cart:active_cart},
                  {autoCommit :true}
            );

           /* await connection.execute(
                "UPDATE BOOK SET STOCK = STOCK - (:copies) WHERE ISBN = :isbn",
                {copies:copies , isbn:isbn},
                {autoCommit : true}
            );*/

           

           //await connection.commit();
           //await connection.execute("COMMIT");
            console.log('successful');
            res.render('successful',{active_cart:active_cart});
            
        }

        else{
           // await connection.rollback();
           //await connection.execute("ROLLBACK");
            res.render('failureMessage' , {message : "Sorry! Your Requested copy is not available to us right now!"});
            return;
        }

    }catch(error){
           console.log(error);
           //await connection.execute("ROLLBACK");
          // await connection.rollback();
        }



    
});

app.get('/Confirm/:active_cart',async function(req,res){

    const active_cart = req.params.active_cart;
     
     try{

        const connection = await connectionModule.getConnection();
        const qq = await connection.execute(
        `SELECT c.TOTAL_PRICE,
        c.TOTAL_ITEM,c.CART_ID,
        b.TITLE AS BOOK_TITLE,
        b.COVER_PHOTO,
        h.NUMBER_OF_COPY,
        h.BASE_PRICE,
        h.DISCOUNT
      FROM SHOPPING_CART c
      JOIN CART_HISTORY h ON c.CART_ID = h.CART_ID
       JOIN BOOK b ON h.ISBN = b.ISBN
     WHERE c.CART_ID = :active_cart`,
      {active_cart:active_cart}
     );

     
      
            //console.log(qq.rows[])
            res.render('cartDetails', { qq: qq});
        
    } catch (error) {
        console.error('Error:', error);
       // res.render('errorPage', { message: 'An error occurred while processing your request' });
    }
}); 
     
app.get('/order/:active_cart',async function(req,res){

    const active_cart = req.params.active_cart;
   
    try{
        const connection = await connectionModule.getConnection();
        
        const qq = await connection.execute(
            `SELECT ca.CUSTOMER_ID, c.ADDRESS_ID
            FROM SHOPPING_CART ca
            JOIN CUSTOMER c ON ca.CUSTOMER_ID = c.CUSTOMER_ID
            WHERE ca.CART_ID = :active_cart`,
            {active_cart :active_cart}
        )

        const aid = qq.rows[0].ADDRESS_ID;
        const cid = qq.rows[0].CUSTOMER_ID;

        await connection.execute(
          "INSERT INTO ORDERR (STATUS, ADDRESS_ID, ORDER_DATE, CART_ID, CUSTOMER_ID)"+
           "VALUES ('Delivery Completed', :aid, SYSDATE, :active_cart, :cid)",
            {aid:aid , active_cart:active_cart ,cid:cid},
            {autoCommit:true}
        )

        await connection.execute(
            "UPDATE SHOPPING_CART SET YET_TO_CONFIRM = 0 WHERE CART_ID = :active_cart",
            {active_cart:active_cart},
            {autoCommit : true}
          );

        console.log('successful');
        res.render('order');

    }catch(error){
        console.log(error);

    }
});


app.get('/seecart',async function(req,res){
    //const customer_id = 1;


    console.log(customerid);

    try{
        const connection = await connectionModule.getConnection();

        const q = await connection.execute(
            `SELECT CART_ID FROM SHOPPING_CART WHERE CUSTOMER_ID = :customerid AND YET_TO_CONFIRM = 1`,
            {customerid:customerid}

        );

          console.log(customerid);
  if(q.rows.length){
        const active_cart = q.rows[0].CART_ID;
        const qq = await connection.execute(
            `SELECT c.TOTAL_PRICE,
            c.TOTAL_ITEM,c.CART_ID,
            b.ISBN AS ISBN,b.TITLE AS BOOK_TITLE,
            b.COVER_PHOTO,
            h.NUMBER_OF_COPY,
            h.BASE_PRICE,
            h.DISCOUNT
          FROM SHOPPING_CART c
          JOIN CART_HISTORY h ON c.CART_ID = h.CART_ID
           JOIN BOOK b ON h.ISBN = b.ISBN
         WHERE c.CART_ID = :active_cart`,
          {active_cart:active_cart}
         );
         console.log(qq);
         if(qq.rows.length){
            
         res.render('cartDetails', { qq: qq});

         }else{
         console.log('hii');
            res.render('failureMessage',{message: "Your cart is empty"});
         }
    
        }

        else{
            //res.send('cart is empty');
            res.render('failureMessage',{message: "Your cart is empty"});
        }
      


    }catch(error){
          console.log(error);
    }

});


app.post('/sell',async function(req,res){

      const startDate = req.body.startDate;
      const endDate = req.body.endDate;
      console.log(req.body);
      console.log(startDate,endDate);

 

    try{

        
        const connection = await connectionModule.getConnection();
       const p = await connection.execute(
        `BEGIN
            :p := GetTotalExpenditure(:customerid, TO_DATE(:startDate, 'YYYY-MM-DD'), TO_DATE(:endDate, 'YYYY-MM-DD'));
        END;`,
        {
            p: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            customerid: customerid,
            startDate: startDate,
            endDate: endDate
        }
    );

    const totalExpenditure = p.outBinds.p;
    console.log(totalExpenditure);
    res.render('seeExpenditure',{totalExpenditure:totalExpenditure , startDate:startDate,endDate:endDate});

    }catch(error){
        console.log(error);
    }
});


app.get('/browseByTitle' ,async function(req,res){
        res.render('search');
});



app.post('/browseByTitle',async function(req,res){
    const title = req.body.title;
    console.log(req.body);
    console.log(title);
 
    try {
     const connection = await connectionModule.getConnection();
 
     const result = await connection.execute(
         `SELECT *
         FROM BOOK
         WHERE INSTR(LOWER(TITLE), LOWER(:title)) > 0`,
         { title:title }
     );
 
 
 
     if(result.rows.length > 0){
         const books = result.rows;
         res.render('BrowseProduct', { books: books });
        }
        else{
         res.render('homepage' , {message : 'no book is available with this title'});
        }
     
    
 } catch (error) {
     console.error("Error searching for book names:", error);
 } 

 });
 
 



app.get('/browseByAuthor',async function(req,res){
      res.render('search');
});

app.post('/browseByAuthor',async function(req,res){
    const author =  req.body.title  //author bole ekta search field takbe
    console.log(req.body);
    console.log(author);


try {
    const connection = await connectionModule.getConnection();

    const result = await connection.execute(
        `SELECT b.*
        FROM author a
        JOIN book_author ba ON a.author_id = ba.author_id
        JOIN book b ON ba.isbn = b.isbn
        WHERE INSTR(LOWER(NAME), LOWER(:author)) > 0`,
        { author:author }
    );



    if(result.rows.length > 0){
        const books = result.rows;
        res.render('BrowseProduct' , {books : books});
       }
       else{
        res.render('homepage' , {message : 'no book is available of this author'});
       }
    
   
} catch (error) {
    console.error("Error searching for similar names:", error);
} 

});



app.get('/browseByCategory' , async function(req,res){
    res.render('search');
});

app.post('/browseByCategory',async function(req,res){

    const categoryName = req.body.title; 
    console.log(req.body);

try {
    const connection = await connectionModule.getConnection();

    const result = await connection.execute(
        `SELECT b.*
         FROM BOOK b
         JOIN BOOK_CATEGORY bc ON b.ISBN = bc.ISBN
         JOIN CATEGORY c ON bc.CATEGORY_ID = c.CATEGORY_ID
         WHERE INSTR(LOWER(NAME), LOWER(:categoryName)) > 0`,
        { categoryName: categoryName }
    );

  
    
    //console.log("Books in category:", booksInCategory);
    if(result.rows.length > 0){
        const books = result.rows;
        res.render('BrowseProduct' , {books : books});
       }
       else{
        res.render('homepage' , {message : 'no book is available of this category'});
       }
    

} catch (error) {
    console.error("Error searching for books by category:", error);
} 


});




app.get('/browseBycategoryofAuthor' , async function(req,res){
    res.render('search2');
});

app.post('/browseBycategoryofAuthor',async function(req,res){

    const author = req.body.author; 
    const category = req.body.category;
    console.log(req.body);

try {
    const connection = await connectionModule.getConnection();

    const result = await connection.execute(
        `SELECT b.* 
        FROM BOOK b
        JOIN BOOK_CATEGORY bc ON b.ISBN = bc.ISBN
        JOIN CATEGORY c ON bc.CATEGORY_ID = c.CATEGORY_ID
        JOIN BOOK_AUTHOR bw ON b.ISBN = bw.ISBN
        JOIN AUTHOR w ON bw.AUTHOR_ID = w.AUTHOR_ID
        WHERE INSTR(LOWER(w.NAME), LOWER(:author)) > 0
        AND INSTR(LOWER(c.NAME), LOWER(:category)) > 0`,
        { author:author,category: category }
    );

  
    
    //console.log("Books in category:", booksInCategory);
    if(result.rows.length > 0){
        const books = result.rows;
        res.render('BrowseProduct' , {books : books});
       }
       else{
        res.render('homepage' , {message : 'no book is available of this category'});
       }
    

} catch (error) {
    console.error("Error searching for books by category:", error);
} 


});



app.get('/searchByPrice', async function(req,res){
    res.send('/searchByPrice');
});

app.post('/searchByPrice',async function(req,res){
    const minPrice = req.body.min;
    const maxPrice = req.body.max; 
    console.log(req.body);
    console.log(minPrice,maxPrice);
    
    try {
        const connection = await connectionModule.getConnection();
    
        const result = await connection.execute(
            `SELECT *
             FROM BOOK
             WHERE PRICE BETWEEN :minPrice AND :maxPrice`,
            { minPrice: minPrice, maxPrice: maxPrice }
        );
    
       

        if(result.rows.length > 0){
            const books = result.rows;
            res.render('BrowseProduct' , {books : books});
           }
           else{
            res.render('homepage' , {message : 'no book is available of this price'});
           }
        
      
       
    } catch (error) {
        console.error("Error searching for books by price range:", error);
    } 
});


app.get('/advanceSearch' , async function(req,res){
    res.render('advanceSearch');
});


app.post('/advanceSearch',async function(req,res){
    console.log(req.body);

    const title = req.body.title;
    const category = req.body.category;
    const writer = req.body.writer;
    const edition = req.body.edition;
    


    try {
        const connection = await connectionModule.getConnection();
    
        const result = await connection.execute(
            `SELECT B.*
            FROM BOOK B
            JOIN BOOK_CATEGORY BC ON B.ISBN = BC.ISBN
            JOIN CATEGORY C ON BC.CATEGORY_ID = C.CATEGORY_ID
            JOIN BOOK_AUTHOR BA ON B.ISBN = BA.ISBN
            JOIN AUTHOR A ON BA.AUTHOR_ID = A.AUTHOR_ID
            WHERE B.EDITION = :edition AND
            INSTR(UPPER(B.TITLE), UPPER(:title)) > 0
            AND INSTR(UPPER(C.NAME), UPPER(:category)) > 0
            AND INSTR(UPPER(A.NAME), UPPER(:writer)) > 0`,
            {edition:edition, title: title, category: category , writer:writer }
        );

        if(result.rows.length > 0){
            const books = result.rows;
            console.log(books);
            res.render('BrowseProduct' , {books : books});
           }
           else{
            res.render('homepage' , {message : 'no book is available of this search'});
           }

    }catch(error){
        console.log(error);
    }
});


app.get('/logout',async function(req,res){
    try{
        const connection = await connectionModule.getConnection();

        const result = await connection.execute(
            `BEGIN return_unordered_items(:customer_id); END;`,
            {
              customer_id: customerid 
            }
          );
      console.log('procedure runs successfully');
      res.render('StartPage',{message : 'Log Out Successful'});
    }catch(error){
        console.log(error);
    }
});

app.post('/updateQuantity/:isbn',async function(req,res){
     console.log('successful'); 
     const isbn = req.params.isbn;
     console.log(req.body);
     const updatedQuantity = req.body.quantity;
     console.log(updatedQuantity);
     try{

        const connection = await connectionModule.getConnection();  

        const pq = await connection.execute(
            `SELECT CART_ID FROM SHOPPING_CART WHERE CUSTOMER_ID = :customerid AND YET_TO_CONFIRM = 1`,
            {customerid:customerid}
      );

      const active_cart = pq.rows[0].CART_ID;


     await connection.execute(
        `UPDATE CART_HISTORY SET NUMBER_OF_COPY = :updatedQuantity WHERE ISBN = :isbn AND CART_ID = :active_cart`,
        { updatedQuantity: updatedQuantity, isbn: isbn ,active_cart:active_cart}
    );

    const totalItemQuery =await connection.execute(
        `SELECT SUM(NUMBER_OF_COPY) AS total_items
        FROM CART_HISTORY
        WHERE CART_ID = :active_cart`,
        {active_cart:active_cart}
        );

       const totalPriceQuery = await connection.execute(
       `SELECT SUM(NUMBER_OF_COPY *(BASE_PRICE - BASE_PRICE*NVL(DISCOUNT/100,0))) AS total_price
       FROM CART_HISTORY
       WHERE CART_ID = :active_cart`,
       {active_cart : active_cart}
       );

      const totalPrice = totalPriceQuery.rows[0].TOTAL_PRICE;
      const totalitem = totalItemQuery.rows[0].TOTAL_ITEMS;
      console.log(totalPrice);
      console.log(totalitem);

         
       await connection.execute(
             "UPDATE SHOPPING_CART SET TOTAL_PRICE = :totalPrice , TOTAL_ITEM = :totalitem  WHERE CART_ID = :active_cart",
             {totalPrice:totalPrice , totalitem:totalitem, active_cart:active_cart},
             {autoCommit :true}
       );

       res.render('homepage' , {message: 'Update Successful'})

       



}catch(error){
    console.log(error);
}

});

app.get('/shop',async function(req,res){

    try {
        const connection = await connectionModule.getConnection();

        const q = await connection.execute(
            "SELECT * FROM (SELECT * FROM BOOK) WHERE ROWNUM <= 48"

        );
         const books = q.rows;
         res.render('shop', { books: books });
     } catch (error) {
         console.error("Error fetching books:", error);
         res.status(500).send("Error fetching books. Please try again later.");
     }
});

app.get('/aboutus',async function(req,res){
    res.render('aboutus');
})

app.get('/seedetails/:isbn',async function(req,res){
    const isbn = req.params.isbn;
    console.log(isbn);
     try{
        const connection = await connectionModule.getConnection();

        
        const result = await connection.execute(
            "SELECT B.*, A.NAME AS AUTHOR_NAME " +
            "FROM AUTHOR A " +
            "JOIN BOOK_AUTHOR BA ON A.AUTHOR_ID = BA.AUTHOR_ID " +
            "JOIN BOOK B ON BA.ISBN = B.ISBN " +
            "WHERE B.ISBN = :isbn",
            { isbn:isbn },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const categoriesResult = await connection.execute(
            "SELECT C.NAME AS CATEGORYNAME " +
            "FROM CATEGORY C " +
            "JOIN BOOK_CATEGORY BC ON C.CATEGORY_ID = BC.CATEGORY_ID " +
            "WHERE BC.ISBN = :isbn",
            { isbn }
        );

        const book = {
            isbn: result.rows[0].ISBN,
            title: result.rows[0].TITLE,
            price: result.rows[0].PRICE,
            weight: result.rows[0].WEIGHT,
            photo:result.rows[0].COVER_PHOTO,
            dimension: result.rows[0].DIMENSION,
            edition: result.rows[0].EDITION,
            publication_year: result.rows[0].PUBLICATION_YEAR,
            language: result.rows[0].LANGUAGE,
            stock: result.rows[0].STOCK,
            authors: result.rows.map(row => ({ AUTHOR_NAME: row.AUTHOR_NAME })),
            categories: categoriesResult.rows.map(row => ({ CATEGORYNAME: row.CATEGORYNAME }))
        };

    
            
            res.render('bookdetails',{book :book});
        
     }catch(error){
        console.log(error);
     }

});


app.get('/bestSelling', async function(req, res) {
    try {
        const connection = await connectionModule.getConnection();
        
        await connection.execute(
        `BEGIN
        top_10_book;
        END;`
           
        );

        const result = await connection.execute(
           "SELECT * FROM TOP_BOOKS_SALES",
           
        );
      
        console.log("Stored procedure executed successfully");
        const qq = result.rows;
        res.render('bestSelling',{qq:qq});
       
    } catch(error) {
        console.log(error);
        res.status(500).send("An error occurred while fetching top publishers.");
    }
});


app.post('/updatepassword',async function(req,res){
    console.log(req.body);
    const old = req.body.oldPassword;
    const New = req.body.newPassword;
    try{
        const connection = await connectionModule.getConnection();

        const qq = await connection.execute(
            "SELECT PASSWORD FROM CUSTOMER WHERE CUSTOMER_ID = :customerid",
            {customerid:customerid}

        );

        if(qq.rows.length){
            const correct = qq.rows[0].PASSWORD;
            if(correct == old){
                await connection.execute(
                 "UPDATE CUSTOMER SET PASSWORD = :New WHERE CUSTOMER_ID = :customerid",
                 {New:New,customerid:customerid}
                );

                res.render('homepage',{message:'Password Updates Successfully'});

            }else{
                res.render('homepage',{message:'Your Password is wrong'})
            }
        }

    }catch(error){
        console.log(error);
    }
})

