------------------------------------1------------------------
--------------This trigger will ensure that one discount is active at a time for any book----------------
DROP TRIGGER single_active_offer;

CREATE OR REPLACE TRIGGER single_active_offer
BEFORE INSERT ON OFFER_HISTORY
FOR EACH ROW


DECLARE
    active_offer_count NUMBER;
    new_start_date DATE;
    new_expired_date DATE;
BEGIN
   
    SELECT START_DATE, EXPIRED_DATE INTO new_start_date, new_expired_date
    FROM OFFER
    WHERE OFFER_ID = :NEW.OFFER_ID;

  
    SELECT COUNT(*) INTO active_offer_count
    FROM OFFER_HISTORY oh
    JOIN OFFER o ON oh.OFFER_ID = o.OFFER_ID
    WHERE oh.ISBN = :NEW.ISBN
    AND (new_start_date BETWEEN o.START_DATE AND o.EXPIRED_DATE
        OR new_expired_date BETWEEN o.START_DATE AND o.EXPIRED_DATE
        OR (new_start_date <= o.START_DATE AND new_expired_date >= o.EXPIRED_DATE));

   
    IF active_offer_count > 0 THEN
          RAISE_APPLICATION_ERROR(-20001, 'A book can only have one active offer at a time.');
    END IF;
END;
/



-----------------------------2---------------------------
----------------------this trigger will ensure a customer can ACCESS a offer for just one time----------------

DROP TRIGGER enforce_single_offer;

CREATE OR REPLACE TRIGGER enforce_single_offer
BEFORE INSERT ON CART_HISTORY
FOR EACH ROW
DECLARE
    existing_offer_count NUMBER;
    cart_customer_id NUMBER;
BEGIN
  
    SELECT CUSTOMER_ID INTO cart_customer_id
    FROM SHOPPING_CART
    WHERE CART_ID = :NEW.CART_ID;

 
    SELECT COUNT(*) INTO existing_offer_count
    FROM CART_HISTORY ch
    WHERE ch.OFFER_ID = :NEW.OFFER_ID
    AND ch.CART_ID != :NEW.CART_ID
    AND ch.CART_ID IN (SELECT CART_ID FROM SHOPPING_CART WHERE CUSTOMER_ID = cart_customer_id);


    IF existing_offer_count > 0 THEN
         RAISE_APPLICATION_ERROR(-20001,'The customer has already applied this offer to another cart.');
    END IF;
END;
/

-------------------------------3------------------------------------
---------------------------this trigger will ensure one customer can have one active cart at a time------------------

CREATE OR REPLACE TRIGGER ensure_one_active_cart
BEFORE INSERT ON SHOPPING_CART
FOR EACH ROW
DECLARE
    v_active_cart_count NUMBER;
BEGIN
  
    SELECT COUNT(*)
    INTO v_active_cart_count
    FROM SHOPPING_CART
    WHERE CUSTOMER_ID = :NEW.CUSTOMER_ID
    AND YET_TO_CONFIRM = 1;

  
    IF v_active_cart_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'A customer can have only one active cart at a time.');
    END IF;
END;
/



--------------------------------4----------------------------
----------------------------this trigger will ensure if any cart is go to inactive it will never be active----------------------

CREATE OR REPLACE TRIGGER yet_to_confirm_trigger
BEFORE UPDATE OF yet_to_confirm ON shopping_cart
FOR EACH ROW
BEGIN
    IF :OLD.yet_to_confirm = 0 AND :NEW.yet_to_confirm = 1 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Cannot change YET_TO_CONFIRM from 0 to 1.');
    END IF;
END;
/






--------------------------------------5---------------------------------
-----------------------------this trigger will ensure discound added to cart_history is consistent to its related offer---------------------
DROP TRIGGER check_discount_consistency;

CREATE OR REPLACE TRIGGER check_discount_consistency
BEFORE INSERT ON CART_HISTORY
FOR EACH ROW
DECLARE
    v_offer_discount OFFER.DISCOUNT%TYPE;
BEGIN
    -- Check if the offer ID in CART_HISTORY has a corresponding discount in OFFER
    BEGIN
        SELECT DISCOUNT INTO v_offer_discount
        FROM OFFER
        WHERE OFFER_ID = :NEW.OFFER_ID;

    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            v_offer_discount := NULL; -- No discount found for the offer ID
    END;

    -- Only perform the consistency check if a discount is applied
    IF v_offer_discount IS NOT NULL THEN
        IF :NEW.DISCOUNT <> v_offer_discount THEN
            RAISE_APPLICATION_ERROR(-20001, 'Discount in CART_HISTORY does not match the discount in the corresponding OFFER.');
        END IF;
    END IF;
END;
/
