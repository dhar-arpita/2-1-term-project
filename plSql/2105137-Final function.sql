



 --------1.---------------------Total expenditure of a Customer---------------



CREATE OR REPLACE FUNCTION GetTotalExpenditure(
    customerId IN NUMBER,
    startDate IN DATE,
    endDate IN DATE
) RETURN NUMBER
IS
    totalExpenditure NUMBER := 0; 
BEGIN
    
    SELECT NVL(SUM(NVL(sc.TOTAL_PRICE,0)),0)
	  INTO totalExpenditure
    FROM SHOPPING_CART sc
    JOIN "ORDERR" o ON o.CART_ID = sc.CART_ID
    WHERE o.ORDER_DATE BETWEEN startDate AND endDate
    AND sc.CUSTOMER_ID = customerId;

    RETURN totalExpenditure;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0; 
END GetTotalExpenditure;




 -----------2.-----------------------------validate a cart------------------------


CREATE OR REPLACE FUNCTION validate_cart(
       p_cart_id IN SHOPPING_CART.CART_ID%TYPE,
        p_requested_isbn IN BOOK.ISBN%TYPE,
        p_requested_copies IN CART_HISTORY.NUMBER_OF_COPY%TYPE,
        p_requested_price IN BOOK.PRICE%TYPE
    ) RETURN NUMBER IS
        v_stock_count NUMBER;
        v_base_price NUMBER(10, 2);
    BEGIN

			 
       SELECT STOCK INTO v_stock_count
      FROM BOOK
      WHERE ISBN = p_requested_isbn;

      
       SELECT PRICE INTO v_base_price
       FROM BOOK
       WHERE ISBN = p_requested_isbn;

       
       IF v_stock_count >= p_requested_copies AND v_base_price = p_requested_price THEN
           RETURN 1;
       ELSE
          RETURN 0;
       END IF;
   EXCEPTION
       WHEN NO_DATA_FOUND THEN
         
           RETURN 0;
       WHEN OTHERS THEN
          RETURN 0;
   END validate_cart;










       









