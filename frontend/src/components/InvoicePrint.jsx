import React, { forwardRef } from "react";

const InvoicePrint = forwardRef(
  ({ items, total, discount, finalTotal }, ref) => {
    if (!items || items.length === 0) return null;

    return (
      <div
        ref={ref}
        style={{
          width: "80mm",
          padding: "10px",
          fontSize: "12px",
          fontFamily: "monospace"
        }}
      >
        <h3 style={{ textAlign: "center" }}>CỬA HÀNG ABC</h3>
        <p style={{ textAlign: "center" }}>0909 000 000</p>

        <hr />

        <table width="100%">
          <thead>
            <tr>
              <th align="left">Tên</th>
              <th>SL</th>
              <th>Giá</th>
              <th align="right">T.T</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i, idx) => (
              <tr key={idx}>
                <td>{i.product_name || i.name}</td>
                <td align="center">{i.quantity}</td>
                <td align="right">{i.price}</td>
                <td align="right">
                  {i.total ?? i.price * i.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        <p>Tổng: {total}</p>
        <p>Giảm giá: {discount}</p>
        <h4>Thanh toán: {finalTotal}</h4>

        <p style={{ textAlign: "center" }}>Cảm ơn quý khách!</p>
      </div>
    );
  }
);

export default InvoicePrint;