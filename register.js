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


app.get('/')

 

