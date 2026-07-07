import { useState } from "react";
import "./App.css";

function App() {
  const [memberCount, setMemberCount] = useState(4);
  const [payments, setPayments] = useState([]);

  const [shopName, setShopName] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(1);

  const members = Array.from({ length: memberCount }, (_, i) => i + 1);

  const increaseMember = () => {
    setMemberCount(memberCount + 1);
  };

  const decreaseMember = () => {
    if (memberCount <= 1) return;
    setMemberCount(memberCount - 1);

    if (payer > memberCount - 1) {
      setPayer(memberCount - 1);
    }
  };

  const addPayment = () => {
    if (!shopName || !amount) return;

    setPayments([
      ...payments,
      {
        id: Date.now(),
        shopName,
        amount: Number(amount),
        payer: Number(payer),
      },
    ]);

    setShopName("");
    setAmount("");
    setPayer(1);
  };

  const deletePayment = (id) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const perPerson = memberCount > 0 ? total / memberCount : 0;

  const result = members.map((member) => {
    const paid = payments
      .filter((p) => p.payer === member)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      member,
      paid,
      shouldPay: perPerson,
      balance: paid - perPerson,
    };
  });

  const receivers = result
    .filter((r) => r.balance > 0)
    .map((r) => ({ member: r.member, amount: Math.round(r.balance) }));

  const senders = result
    .filter((r) => r.balance < 0)
    .map((r) => ({ member: r.member, amount: Math.abs(Math.round(r.balance)) }));

  const transfers = [];
  let i = 0;
  let j = 0;

  while (i < senders.length && j < receivers.length) {
    const sendAmount = Math.min(senders[i].amount, receivers[j].amount);

    transfers.push({
      from: senders[i].member,
      to: receivers[j].member,
      amount: sendAmount,
    });

    senders[i].amount -= sendAmount;
    receivers[j].amount -= sendAmount;

    if (senders[i].amount === 0) i++;
    if (receivers[j].amount === 0) j++;
  }

  return (
    <div className="container">
      <h1>🍺 술자리 정산</h1>

      <section className="top-card">
        <h2>결제 내역 추가</h2>

        <label>가게 이름</label>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="예: 1차 포차, 2차 노래방"
        />

        <label>금액</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="예: 120000"
          type="number"
        />

        <label>결제자</label>
        <select value={payer} onChange={(e) => setPayer(e.target.value)}>
          {members.map((member) => (
            <option key={member} value={member}>
              {member}번 참석자
            </option>
          ))}
        </select>

        <button className="primary-btn" onClick={addPayment}>
          결제 추가
        </button>
      </section>

      <section>
        <h2>참석자 수</h2>

        <div className="counter">
          <button onClick={decreaseMember}>-</button>
          <strong>{memberCount}명</strong>
          <button onClick={increaseMember}>+</button>
        </div>

        <p className="member-list">
          참석자: {members.map((m) => `${m}번`).join(", ")}
        </p>
      </section>

      <section>
        <h2>결제 목록</h2>

        {payments.length === 0 && <p className="empty">아직 결제 내역이 없습니다.</p>}

        {payments.map((p, index) => (
          <div className="payment-item" key={p.id}>
            <div>
              <strong>{index + 1}차</strong> {p.shopName}
              <br />
              <span>
                {p.amount.toLocaleString()}원 / {p.payer}번 결제
              </span>
            </div>

            <button className="delete-btn" onClick={() => deletePayment(p.id)}>
              삭제
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>정산 요약</h2>

        <div className="summary">
          <p>총액</p>
          <strong>{total.toLocaleString()}원</strong>
        </div>

        <div className="summary">
          <p>1인당</p>
          <strong>{Math.round(perPerson).toLocaleString()}원</strong>
        </div>
      </section>

      <section>
        <h2>개인별 정산</h2>

        {result.map((r) => (
          <div className="result-item" key={r.member}>
            <strong>{r.member}번</strong>
            <span>결제 {r.paid.toLocaleString()}원</span>
            <span>
              {r.balance > 0
                ? `${Math.round(r.balance).toLocaleString()}원 받아야 함`
                : `${Math.abs(Math.round(r.balance)).toLocaleString()}원 보내야 함`}
            </span>
          </div>
        ))}
      </section>

      <section>
        <h2>송금 정리</h2>

        {transfers.length === 0 && <p className="empty">정산할 금액이 없습니다.</p>}

        {transfers.map((t, index) => (
          <div className="transfer-item" key={index}>
            {t.from}번 → {t.to}번{" "}
            <strong>{t.amount.toLocaleString()}원</strong>
          </div>
        ))}
      </section>
    </div>
  );
}

export default App;