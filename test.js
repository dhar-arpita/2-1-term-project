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
