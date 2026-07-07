import { useState } from "react";
import "./App.css";

const money = (n) => Math.round(n).toLocaleString();

function App() {
  const [mode, setMode] = useState("count");
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(["철수", "영희", "민수"]);
  const [name, setName] = useState("");

  const [shop, setShop] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState("");
  const [parts, setParts] = useState([]);
  const [payments, setPayments] = useState([]);

  const members =
    mode === "count" ? Array.from({ length: count }, (_, i) => `${i + 1}번`) : names;

  const resetPayForm = () => {
    setShop("");
    setAmount("");
    setPayer("");
    setParts([]);
  };

  const changeMode = (v) => {
    setMode(v);
    setPayments([]);
    resetPayForm();
  };

  const toggle = (m) => {
    setParts(parts.includes(m) ? parts.filter((x) => x !== m) : [...parts, m]);
  };

  const addName = () => {
    const v = name.trim();
    if (!v || names.includes(v)) return;
    setNames([...names, v]);
    setName("");
  };

  const removeName = (v) => {
    setNames(names.filter((x) => x !== v));
    setPayments(payments.filter((p) => p.payer !== v));
    setParts(parts.filter((x) => x !== v));
    if (payer === v) setPayer("");
  };

  const addPayment = () => {
    if (!shop || !amount || !payer) return alert("가게, 금액, 결제자를 입력해줘.");
    if (parts.length === 0) return alert("참석자를 선택해줘.");
    if (!parts.includes(payer)) return alert("결제자도 참석자에 포함되어야 해.");

    setPayments([
      ...payments,
      {
        id: Date.now(),
        shop,
        amount: Number(amount),
        payer,
        parts,
      },
    ]);

    resetPayForm();
  };

  const total = payments.reduce((s, p) => s + p.amount, 0);

  const paidBy = (m) =>
    payments.filter((p) => p.payer === m).reduce((s, p) => s + p.amount, 0);

  const shareOf = (m) =>
    payments.reduce(
      (s, p) => s + (p.parts.includes(m) ? p.amount / p.parts.length : 0),
      0
    );

  const needToPay = (m) =>
    payments.reduce((s, p) => {
      if (!p.parts.includes(m) || p.payer === m) return s;
      return s + p.amount / p.parts.length;
    }, 0);

  const payerLabel = (m, text = "결제") =>
    payments
      .map((p, i) => (p.payer === m ? `${i + 1}차 ${text}` : null))
      .filter(Boolean);

  const result = members.map((m) => ({
    member: m,
    paid: paidBy(m),
    share: shareOf(m),
    balance: paidBy(m) - shareOf(m),
    need: needToPay(m),
    labels: payerLabel(m),
  }));

  const transfersMap = {};

  payments.forEach((p, i) => {
    const each = Math.round(p.amount / p.parts.length);

    p.parts.forEach((m) => {
      if (m === p.payer) return;

      const key = `${m}->${p.payer}`;
      if (!transfersMap[key]) {
        transfersMap[key] = {
          from: m,
          to: p.payer,
          amount: 0,
          rounds: [],
        };
      }

      transfersMap[key].amount += each;
      transfersMap[key].rounds.push(`${i + 1}차`);
    });
  });

  const transfers = Object.values(transfersMap);

  const settlementText = `
🍺 술자리 정산 결과

총액: ${money(total)}원

[차수별 결제/참석자]
${payments
  .map(
    (p, i) =>
      `${i + 1}차 ${p.shop}
- 금액: ${money(p.amount)}원
- 결제자: ${p.payer}
- 참석인원: ${p.parts.length}명
- 참석자: ${p.parts.join(", ")}`
  )
  .join("\n\n")}

[개인별 내야 할 금액]
${result
  .map(
    (r) =>
      `${r.member}${r.labels.length ? ` (${payerLabel(r.member, "결제자").join(", ")})` : ""}: ${money(r.need)}원`
  )
  .join("\n")}

[송금 정리]
${
  transfers.length === 0
    ? "정산할 금액 없음"
    : transfers
        .map((t) => `${t.rounds.join(", ")} ${t.from} → ${t.to}: ${money(t.amount)}원`)
        .join("\n")
}
`.trim();

  const copy = async () => {
    await navigator.clipboard.writeText(settlementText);
    alert("복사되었습니다.");
  };

  const download = () => {
    const blob = new Blob([settlementText], { type: "text/plain;charset=utf-8" });
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
        <h2>결제 추가</h2>

        <label>가게 이름</label>
        <input value={shop} onChange={(e) => setShop(e.target.value)} placeholder="예: 펀비어" />

        <label>금액</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="예: 120000" />

        <label>결제자</label>
        <select value={payer} onChange={(e) => setPayer(e.target.value)}>
          <option value="">결제자 선택</option>
          {members.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>

        <label>해당 차수 참석자</label>
        <div className="participant-actions">
          <button onClick={() => setParts([...members])}>전체 선택</button>
          <button onClick={() => setParts([])}>전체 해제</button>
        </div>

        <div className="participant-list">
          {members.map((m) => (
            <button key={m} className={parts.includes(m) ? "selected" : ""} onClick={() => toggle(m)}>
              {m}
            </button>
          ))}
        </div>

        <button className="primary-btn" onClick={addPayment}>결제 추가</button>
      </section>

      <section>
        <h2>참석자 설정</h2>

        <div className="mode-buttons">
          <button className={mode === "count" ? "active" : ""} onClick={() => changeMode("count")}>
            숫자로 관리
          </button>
          <button className={mode === "name" ? "active" : ""} onClick={() => changeMode("name")}>
            이름으로 관리
          </button>
        </div>

        {mode === "count" ? (
          <>
            <div className="counter">
              <button onClick={() => setCount(Math.max(1, count - 1))}>-</button>
              <strong>{count}명</strong>
              <button onClick={() => setCount(count + 1)}>+</button>
            </div>
            <p className="member-list">전체 인원: {members.join(", ")}</p>
          </>
        ) : (
          <>
            <div className="name-input">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="참석자 이름" />
              <button onClick={addName}>추가</button>
            </div>

            <div className="name-list">
              {names.map((n) => (
                <div className="name-item" key={n}>
                  <span>{n}</span>
                  <button onClick={() => removeName(n)}>삭제</button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2>결제 목록</h2>
        {payments.length === 0 && <p className="empty">아직 결제 내역이 없습니다.</p>}

        {payments.map((p, i) => (
          <div className="payment-item" key={p.id}>
            <div>
              <strong>{i + 1}차</strong> {p.shop}
              <br />
              <span>{money(p.amount)}원 / {p.payer} 결제 / {p.parts.length}명 참석</span>
              <br />
              <span>참석자: {p.parts.join(", ")}</span>
            </div>
            <button className="delete-btn" onClick={() => setPayments(payments.filter((x) => x.id !== p.id))}>
              삭제
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>정산 요약</h2>
        <div className="summary">
          <p>총액</p>
          <strong>{money(total)}원</strong>
        </div>
      </section>

      <section>
        <h2>개인별 정산</h2>
        {result.map((r) => (
          <div className="personal-card" key={r.member}>
            <div>
              <strong className="person-name">{r.member}</strong>
              {r.labels.length > 0 && <div className="paid-badge">🟢 {r.labels.join(", ")}</div>}
            </div>
            <div className="pay-amount">
              <span>내야 할 금액</span>
              <strong>{money(r.need)}원</strong>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>송금 정리</h2>
        {transfers.length === 0 && <p className="empty">정산할 금액이 없습니다.</p>}
        {transfers.map((t, i) => (
          <div className="transfer-item" key={i}>
            {t.rounds.join(", ")} {t.from} → {t.to} <strong>{money(t.amount)}원</strong>
          </div>
        ))}
      </section>

      <section>
        <h2>정산 결과 공유</h2>
        <textarea className="settlement-text" value={settlementText} readOnly />
        <div className="share-buttons">
          <button onClick={copy}>복사하기</button>
          <button onClick={download}>다운로드</button>
        </div>
      </section>
    </div>
  );
}

export default App;