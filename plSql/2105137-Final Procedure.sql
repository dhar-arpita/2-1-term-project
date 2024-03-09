  ---1.--------Monthy Gross---------

CREATE OR REPLACE PROCEDURE monthly_gross_sales
IS
BEGIN
    DELETE FROM monthly_gross;

    INSERT INTO monthly_gross (month_year, total_sales, total_books, total_copies)
    SELECT TO_CHAR(o.ORDER_DATE, 'YYYY-MM') AS month_year,
           SUM(ch.BASE_PRICE * ch.NUMBER_OF_COPY * (1 - NVL(ch.DISCOUNT, 0) / 100)) AS total_sales,
           COUNT(DISTINCT ch.ISBN) AS total_books,
           SUM(ch.NUMBER_OF_COPY) AS total_copies
    FROM ORDERR o
    JOIN SHOPPING_CART sc ON o.CART_ID = sc.CART_ID
    JOIN CART_HISTORY ch ON sc.CART_ID = ch.CART_ID
    WHERE o.STATUS = 'Delivery Completed'
    GROUP BY TO_CHAR(o.ORDER_DATE, 'YYYY-MM');

    COMMIT;
END;






   --2.----------Returned Unordered Items------------------
                 

CREATE OR REPLACE PROCEDURE return_unordered_items(customer_id IN NUMBER) AS
BEGIN
 
    UPDATE BOOK b
    SET b.STOCK = b.STOCK + (
        SELECT SUM(ch.NUMBER_OF_COPY)
        FROM CART_HISTORY ch
        JOIN SHOPPING_CART sc ON ch.CART_ID = sc.CART_ID
        WHERE sc.CUSTOMER_ID = customer_id
        AND sc.YET_TO_CONFIRM = 1
        AND ch.ISBN = b.ISBN
    )
    WHERE b.ISBN IN (
        SELECT DISTINCT ch.ISBN
        FROM CART_HISTORY ch
        JOIN SHOPPING_CART sc ON ch.CART_ID = sc.CART_ID
        WHERE sc.CUSTOMER_ID = customer_id
        AND sc.YET_TO_CONFIRM = 1
    );

   
    UPDATE SHOPPING_CART sc
    SET sc.TOTAL_ITEM = sc.TOTAL_ITEM - (
            SELECT SUM(ch.NUMBER_OF_COPY)
            FROM CART_HISTORY ch
            WHERE ch.CART_ID = sc.CART_ID
            AND sc.YET_TO_CONFIRM = 1
        ),
        sc.TOTAL_PRICE = sc.TOTAL_PRICE - (
            SELECT SUM(ch.BASE_PRICE * ch.NUMBER_OF_COPY * (1 - NVL(ch.DISCOUNT, 0) / 100))
            FROM CART_HISTORY ch
            WHERE ch.CART_ID = sc.CART_ID
            AND sc.YET_TO_CONFIRM = 1
        )
    WHERE sc.CUSTOMER_ID = customer_id
    AND sc.YET_TO_CONFIRM = 1;

  
    
    DELETE FROM CART_HISTORY
    WHERE CART_ID IN (
        SELECT sc.CART_ID
        FROM SHOPPING_CART sc
        WHERE sc.CUSTOMER_ID = customer_id
        AND sc.YET_TO_CONFIRM = 1
    );

    COMMIT;
END;







  --3.--------------------------top 10 authors by book count---------------------------


CREATE OR REPLACE PROCEDURE top_10_authors
IS
BEGIN
    DELETE FROM top_authors;

    
    INSERT INTO top_authors (author_id, author_name, total_copies, total_book_count)
    SELECT author_id, author_name, total_copies, total_book_count
    FROM (
        SELECT a.AUTHOR_ID AS author_id, 
               a.NAME AS author_name, 
               COUNT(*) AS total_book_count,
               SUM(ci.NUMBER_OF_COPY) AS total_copies
        FROM AUTHOR a
        JOIN BOOK_AUTHOR ba ON a.AUTHOR_ID = ba.AUTHOR_ID
        JOIN BOOK b ON ba.ISBN = b.ISBN
        JOIN CART_HISTORY ci ON b.ISBN = ci.ISBN
        JOIN SHOPPING_CART sc ON ci.CART_ID = sc.CART_ID
        WHERE sc.YET_TO_CONFIRM = 0
        GROUP BY a.AUTHOR_ID, a.NAME
        ORDER BY total_book_count DESC, total_copies DESC
    )
    WHERE ROWNUM <= 10;

    COMMIT;
END;



  --4------------------top 10 authors by total sales--------------------------


CREATE OR REPLACE PROCEDURE top_10_authors
IS
BEGIN
    DELETE FROM top_authors;

    
    INSERT INTO top_authors (author_id, author_name, total_copies, total_book_count)
    SELECT author_id, author_name, total_copies, total_book_count
    FROM (
        SELECT a.AUTHOR_ID AS author_id, 
               a.NAME AS author_name, 
               COUNT(*) AS total_book_count,
               SUM(ci.NUMBER_OF_COPY) AS total_copies
        FROM AUTHOR a
        JOIN BOOK_AUTHOR ba ON a.AUTHOR_ID = ba.AUTHOR_ID
        JOIN BOOK b ON ba.ISBN = b.ISBN
        JOIN CART_HISTORY ci ON b.ISBN = ci.ISBN
        JOIN SHOPPING_CART sc ON ci.CART_ID = sc.CART_ID
        WHERE sc.YET_TO_CONFIRM = 0
        GROUP BY a.AUTHOR_ID, a.NAME
        ORDER BY total_book_count DESC, total_copies DESC
    )
    WHERE ROWNUM <= 10;

    COMMIT;
END; 




 --5.-------------------top 10 books by total count----------------------



CREATE OR REPLACE PROCEDURE top_10_book
IS
BEGIN

   DELETE FROM top_books_sales;

   
    INSERT INTO top_books_sales (book_isbn,book_title,book_photo,copies)
    SELECT book_isbn,book_title,book_photo,copies
    FROM (
        SELECT b.ISBN AS book_isbn,b.TITLE AS book_title, b.COVER_PHOTO AS book_photo,SUM(NUMBER_OF_COPY) AS copies
        FROM BOOK b
        JOIN CART_HISTORY ci ON ci.ISBN = b.ISBN
				JOIN SHOPPING_CART sc ON sc.CART_ID = ci.CART_ID
        WHERE sc.YET_TO_CONFIRM = 0
        GROUP BY b.ISBN,b.TITLE,b.COVER_PHOTO
        ORDER BY copies DESC
    )
    WHERE ROWNUM <= 10;

    COMMIT;
END;


    ---6.-----------------------top 10 book by total sales--------------



CREATE OR REPLACE PROCEDURE top_10_book_sales
IS
BEGIN

  DELETE FROM top_books;

   
    INSERT INTO top_books (book_isbn,book_title,book_photo,total_sales)
    SELECT book_isbn,book_title,book_photo,total_sales
    FROM (
        SELECT b.ISBN AS book_isbn,b.TITLE AS book_title,b.COVER_PHOTO AS book_photo,
				SUM(ci.BASE_PRICE * ci.NUMBER_OF_COPY * (1 - NVL(ci.DISCOUNT,0) / 100)) AS total_sales
        FROM BOOK b
        JOIN CART_HISTORY ci ON ci.ISBN = b.ISBN
				JOIN SHOPPING_CART sc ON sc.CART_ID = ci.CART_ID
        WHERE sc.YET_TO_CONFIRM = 0
        GROUP BY b.ISBN,b.TITLE,b.COVER_PHOTO
        ORDER BY total_sales DESC
    )
    WHERE ROWNUM <= 10;

    COMMIT;
END;





    --7.----------------------top 10 customer---------------


CREATE OR REPLACE PROCEDURE top_10_customers_sales
IS
BEGIN

    DELETE FROM top_customers_sales;

   
    INSERT INTO top_customers_sales (customer_id, customer_name,customer_email,customer_phone, total_sales)
    SELECT customer_id, customer_name,customer_email,customer_phone, total_sales
    FROM (
        SELECT c.CUSTOMER_ID AS customer_id, 
               (c.FIRST_NAME  ||' ' || c.LAST_NAME) AS customer_name, 
							 c.EMAIL AS customer_email,c.PHONE_NO AS customer_phone,
               SUM(ci.BASE_PRICE * ci.NUMBER_OF_COPY * (1 - NVL(ci.DISCOUNT,0) / 100)) AS total_sales
        FROM CUSTOMER c
        JOIN SHOPPING_CART sc ON c.CUSTOMER_ID = sc.CUSTOMER_ID
        JOIN CART_HISTORY ci ON sc.CART_ID = ci.CART_ID
        WHERE sc.YET_TO_CONFIRM = 0
        GROUP BY c.CUSTOMER_ID, c.FIRST_NAME || ' ' || c.LAST_NAME,c.EMAIL,c.PHONE_NO
        ORDER BY total_sales DESC
    )
    WHERE ROWNUM <= 10;

    COMMIT;
END;



     -----8.-------------------top 10 publisher by book count------------------


CREATE OR REPLACE PROCEDURE top_10_publishers
IS
BEGIN
   
   DELETE FROM top_publishers;

   
    INSERT INTO top_publishers (publisher_id, publisher_name, publisher_email,total_books_sold, total_copies_sold)
    SELECT publisher_id, publisher_name,publisher_email, total_books_sold, total_copies_sold
    FROM (
        SELECT p.PUBLISHER_ID AS publisher_id, p.NAME AS publisher_name,p.EMAIL AS publisher_email,
               COUNT(*) AS total_books_sold, SUM(ci.NUMBER_OF_COPY) AS total_copies_sold
        FROM PUBLISHER p
        JOIN BOOK b ON p.PUBLISHER_ID = b.PUBLISHER_ID
        JOIN CART_HISTORY ci ON b.ISBN = ci.ISBN
        JOIN SHOPPING_CART sc ON ci.CART_ID = sc.CART_ID
        WHERE sc.YET_TO_CONFIRM = 0
        GROUP BY p.PUBLISHER_ID, p.NAME,p.EMAIL
        ORDER BY total_books_sold DESC
    )
    WHERE ROWNUM <= 10; 

    COMMIT;
END;



  ---9----------------------top 10 publisher by total sales------------------


CREATE OR REPLACE PROCEDURE top_10_publishers_sales
IS
BEGIN
   
 DELETE FROM top_publishers_sales;

    INSERT INTO top_publishers_sales (publisher_id, publisher_name, publisher_email,total_sales)
    SELECT publisher_id, publisher_name,publisher_email, total_sales
    FROM (
        SELECT p.PUBLISHER_ID AS publisher_id, p.NAME AS publisher_name,p.EMAIL AS publisher_email,
                 SUM(ci.BASE_PRICE * ci.NUMBER_OF_COPY * (1 - NVL(ci.DISCOUNT,0) / 100)) AS total_sales
        FROM PUBLISHER p
        JOIN BOOK b ON p.PUBLISHER_ID = b.PUBLISHER_ID
        JOIN CART_HISTORY ci ON b.ISBN = ci.ISBN
        JOIN SHOPPING_CART sc ON ci.CART_ID = sc.CART_ID
        WHERE sc.YET_TO_CONFIRM = 0
        GROUP BY p.PUBLISHER_ID, p.NAME,p.EMAIL
        ORDER BY total_sales DESC
    )
    WHERE ROWNUM <= 10; 

    COMMIT;
END;





       









