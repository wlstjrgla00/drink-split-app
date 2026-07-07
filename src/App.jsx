import { useState } from "react";
import "./App.css";

function App() {
  const [memberMode, setMemberMode] = useState("count");
  const [memberCount, setMemberCount] = useState(4);
  const [memberNames, setMemberNames] = useState(["철수", "영희", "민수"]);
  const [newMemberName, setNewMemberName] = useState("");

  const [payments, setPayments] = useState([]);
  const [shopName, setShopName] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");

  const members =
    memberMode === "count"
      ? Array.from({ length: memberCount }, (_, i) => `${i + 1}번`)
      : memberNames;

  const changeMemberMode = (mode) => {
    setMemberMode(mode);
    setPayer("");
    setPayments([]);
  };

  const increaseMember = () => {
    setMemberCount(memberCount + 1);
  };

  const decreaseMember = () => {
    if (memberCount <= 1) return;
    setMemberCount(memberCount - 1);
  };

  const addMemberName = () => {
    if (!newMemberName.trim()) return;

    setMemberNames([...memberNames, newMemberName.trim()]);
    setNewMemberName("");
  };

  const deleteMemberName = (name) => {
    setMemberNames(memberNames.filter((m) => m !== name));
    setPayments(payments.filter((p) => p.payer !== name));

    if (payer === name) {
      setPayer("");
    }
  };

  const addPayment = () => {
    if (!shopName || !amount || !payer) return;

    setPayments([
      ...payments,
      {
        id: Date.now(),
        shopName,
        amount: Number(amount),
        payer,
      },
    ]);

    setShopName("");
    setAmount("");
    setPayer("");
  };

  const deletePayment = (id) => {
    setPayments(payments.filter((p) => p.id !== id));
  };

  const total = payments.reduce((sum, p) => sum + p.amount, 0);
  const perPerson = members.length > 0 ? total / members.length : 0;

  const result = members.map((member) => {
    const paid = payments
      .filter((p) => p.payer === member)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      member,
      paid,
      balance: paid - perPerson,
    };
  });

  const receivers = result
    .filter((r) => r.balance > 0)
    .map((r) => ({
      member: r.member,
      amount: Math.round(r.balance),
    }));

  const senders = result
    .filter((r) => r.balance < 0)
    .map((r) => ({
      member: r.member,
      amount: Math.abs(Math.round(r.balance)),
    }));

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

  const getPayerLabels = (member, labelText = "결제자") => {
    return payments
      .map((p, index) =>
        p.payer === member ? `${index + 1}차 ${labelText}` : null
      )
      .filter(Boolean);
  };

  const getNeedToPay = (member) => {
    return payments.reduce((sum, p) => {
      if (p.payer === member) return sum;
      return sum + p.amount / members.length;
    }, 0);
  };

  const settlementText = `
🍺 술자리 정산 결과

총액: ${total.toLocaleString()}원
1인당: ${Math.round(perPerson).toLocaleString()}원

[개인별 내야 할 금액]
${result
  .map((r) => {
    const payerLabels = getPayerLabels(r.member, "결제자");
    const needToPay = getNeedToPay(r.member);

    return `${r.member}${
      payerLabels.length > 0 ? ` (${payerLabels.join(", ")})` : ""
    }: ${Math.round(needToPay).toLocaleString()}원`;
  })
  .join("\n")}

[송금 정리]
${
  transfers.length === 0
    ? "정산할 금액 없음"
    : transfers
        .map((t) => `${t.from} → ${t.to}: ${t.amount.toLocaleString()}원`)
        .join("\n")
}
`.trim();

  const copySettlement = async () => {
    await navigator.clipboard.writeText(settlementText);
    alert("정산 결과가 복사되었습니다.");
  };

  const downloadSettlement = () => {
    const blob = new Blob([settlementText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "술자리_정산결과.txt";
    a.click();

    URL.revokeObjectURL(url);
  };

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
          <option value="">결제자 선택</option>
          {members.map((member) => (
            <option key={member} value={member}>
              {member}
            </option>
          ))}
        </select>

        <button className="primary-btn" onClick={addPayment}>
          결제 추가
        </button>
      </section>

      <section>
        <h2>참석자 설정</h2>

        <div className="mode-buttons">
          <button
            className={memberMode === "count" ? "active" : ""}
            onClick={() => changeMemberMode("count")}
          >
            숫자로 관리
          </button>

          <button
            className={memberMode === "name" ? "active" : ""}
            onClick={() => changeMemberMode("name")}
          >
            이름으로 관리
          </button>
        </div>

        {memberMode === "count" && (
          <>
            <div className="counter">
              <button onClick={decreaseMember}>-</button>
              <strong>{memberCount}명</strong>
              <button onClick={increaseMember}>+</button>
            </div>

            <p className="member-list">참석자: {members.join(", ")}</p>
          </>
        )}

        {memberMode === "name" && (
          <>
            <div className="name-input">
              <input
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="참석자 이름 입력"
              />
              <button onClick={addMemberName}>추가</button>
            </div>

            <div className="name-list">
              {memberNames.map((name) => (
                <div className="name-item" key={name}>
                  <span>{name}</span>
                  <button onClick={() => deleteMemberName(name)}>삭제</button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2>결제 목록</h2>

        {payments.length === 0 && (
          <p className="empty">아직 결제 내역이 없습니다.</p>
        )}

        {payments.map((p, index) => (
          <div className="payment-item" key={p.id}>
            <div>
              <strong>{index + 1}차</strong> {p.shopName}
              <br />
              <span>
                {p.amount.toLocaleString()}원 / {p.payer} 결제
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

        {result.map((r) => {
          const payerLabels = getPayerLabels(r.member, "결제");
          const needToPay = getNeedToPay(r.member);

          return (
            <div className="personal-card" key={r.member}>
              <div>
                <strong className="person-name">{r.member}</strong>

                {payerLabels.length > 0 && (
                  <div className="paid-badge">
                    🟢 {payerLabels.join(", ")}
                  </div>
                )}
              </div>

              <div className="pay-amount">
                <span>내야 할 금액</span>
                <strong>{Math.round(needToPay).toLocaleString()}원</strong>
              </div>
            </div>
          );
        })}
      </section>

      <section>
        <h2>송금 정리</h2>

        {transfers.length === 0 && (
          <p className="empty">정산할 금액이 없습니다.</p>
        )}

        {transfers.map((t, index) => (
          <div className="transfer-item" key={index}>
            {t.from} → {t.to}{" "}
            <strong>{t.amount.toLocaleString()}원</strong>
          </div>
        ))}
      </section>

      <section>
        <h2>정산 결과 공유</h2>

        <textarea className="settlement-text" value={settlementText} readOnly />

        <div className="share-buttons">
          <button onClick={copySettlement}>복사하기</button>
          <button onClick={downloadSettlement}>다운로드</button>
        </div>
      </section>
    </div>
  );
}

export default App;