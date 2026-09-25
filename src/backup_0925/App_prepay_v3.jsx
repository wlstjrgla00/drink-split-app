import { useState } from "react";
import "./App.css";

const money = (value) => `${Math.round(value).toLocaleString()}원`;

// 금액 입력창: 숫자만 상태에 저장하고 화면에는 천 단위 콤마 표시
const formatAmountInput = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
};

const rawAmountInput = (value) => String(value).replace(/\D/g, "");

// 1원 미만이 생기면 인당 금액을 올림 처리
const splitMoney = (amount, people) => {
  if (!people.length || amount <= 0) return {};
  const each = Math.ceil(amount / people.length);
  return Object.fromEntries(people.map((person) => [person, each]));
};

function App() {
  const [page, setPage] = useState("normal");
  const [mode, setMode] = useState("count");
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(["철수", "영희", "민수"]);
  const [newName, setNewName] = useState("");

  const [normalPayments, setNormalPayments] = useState([]);
  const [prepayPayments, setPrepayPayments] = useState([]);

  const [shop, setShop] = useState("");
  const [amount, setAmount] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [prepay, setPrepay] = useState("");
  const [payer, setPayer] = useState("");
  const [participants, setParticipants] = useState([]);
  const [noAlcohol, setNoAlcohol] = useState([]);

  const members =
    mode === "count"
      ? Array.from({ length: count }, (_, i) => `${i + 1}번`)
      : names;

  const payments = page === "normal" ? normalPayments : prepayPayments;
  const setCurrentPayments = (updater) => {
    const setter = page === "normal" ? setNormalPayments : setPrepayPayments;
    setter(updater);
  };

  const allPayments = [...normalPayments, ...prepayPayments];

  const resetPaymentForm = () => {
    setShop("");
    setAmount("");
    setAlcohol("");
    setPrepay("");
    setPayer("");
    setParticipants([]);
    setNoAlcohol([]);
  };

  const switchPage = (nextPage) => {
    if (nextPage === page) return;
    setPage(nextPage);
    resetPaymentForm();
  };

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;
    if (
      allPayments.length > 0 &&
      !window.confirm("참석자 방식을 변경하면 일반/선입금 정산의 기존 결제 내역이 모두 삭제됩니다.")
    ) return;

    setMode(nextMode);
    setNormalPayments([]);
    setPrepayPayments([]);
    resetPaymentForm();
  };

  const decreaseCount = () => {
    if (count <= 1) return;
    const removed = `${count}번`;
    const used = allPayments.some(
      (p) => p.payer === removed || p.participants.includes(removed)
    );

    if (used) return alert(`${removed}이 포함된 결제 내역을 먼저 삭제해줘.`);

    setCount((v) => v - 1);
    setParticipants((v) => v.filter((m) => m !== removed));
    setNoAlcohol((v) => v.filter((m) => m !== removed));
    if (payer === removed) setPayer("");
  };

  const addName = () => {
    const value = newName.trim();
    if (!value) return;
    if (names.includes(value)) return alert("이미 등록된 이름이야.");
    setNames([...names, value]);
    setNewName("");
  };

  const removeName = (name) => {
    const used = allPayments.some(
      (p) => p.payer === name || p.participants.includes(name)
    );
    if (used) return alert(`${name}이 포함된 결제 내역을 먼저 삭제해줘.`);

    setNames(names.filter((m) => m !== name));
    setParticipants(participants.filter((m) => m !== name));
    setNoAlcohol(noAlcohol.filter((m) => m !== name));
    if (payer === name) setPayer("");
  };

  const toggleParticipant = (member) => {
    if (participants.includes(member)) {
      setParticipants(participants.filter((m) => m !== member));
      setNoAlcohol(noAlcohol.filter((m) => m !== member));
      if (payer === member) setPayer("");
    } else {
      setParticipants([...participants, member]);
    }
  };

  const toggleNoAlcohol = (member) =>
    setNoAlcohol(
      noAlcohol.includes(member)
        ? noAlcohol.filter((m) => m !== member)
        : [...noAlcohol, member]
    );

  const addPayment = () => {
    const totalAmount = Math.round(Number(amount));
    const alcoholAmount = Math.round(Number(alcohol || 0));
    const prepayAmount = page === "prepay" ? Math.round(Number(prepay || 0)) : 0;

    if (!shop.trim() || totalAmount <= 0 || !payer)
      return alert("가게 이름, 총금액, 결제자를 입력해줘.");
    if (!participants.length) return alert("해당 차수 참석자를 선택해줘.");
    if (!participants.includes(payer)) return alert("결제자는 해당 차수 참석자여야 해.");
    if (alcoholAmount < 0 || alcoholAmount > totalAmount)
      return alert("술값은 0원 이상이며 총금액보다 클 수 없어.");
    if (prepayAmount < 0) return alert("선입금 금액은 0원 이상이어야 해.");

    const drinkers = participants.filter((m) => !noAlcohol.includes(m));
    if (alcoholAmount > 0 && !drinkers.length)
      return alert("술값을 분담할 사람을 1명 이상 남겨줘.");

    setCurrentPayments((prev) => [
      ...prev,
      {
        id: Date.now(),
        shop: shop.trim(),
        amount: totalAmount,
        alcohol: alcoholAmount,
        prepay: prepayAmount,
        payer,
        participants: [...participants],
        noAlcohol: [...noAlcohol],
      },
    ]);
    resetPaymentForm();
  };

  const calculateShares = (payment) => {
    const normalAmount = payment.amount - payment.alcohol;
    const drinkers = payment.participants.filter(
      (m) => !payment.noAlcohol.includes(m)
    );
    const normalShares = splitMoney(normalAmount, payment.participants);
    const alcoholShares = splitMoney(payment.alcohol, drinkers);

    return Object.fromEntries(
      payment.participants.map((m) => [
        m,
        (normalShares[m] || 0) + (alcoholShares[m] || 0),
      ])
    );
  };

  const details = payments.map((payment, index) => ({
    ...payment,
    round: index + 1,
    drinkers: payment.participants.filter(
      (m) => !payment.noAlcohol.includes(m)
    ),
    shares: calculateShares(payment),
  }));

  const total = payments.reduce((sum, p) => sum + p.amount, 0);

  const getSettlement = (payment, member) => {
    const share = payment.shares[member] || 0;
    if (!share || member === payment.payer)
      return { prepaid: 0, due: 0, refund: 0 };

    const prepaid = page === "prepay" ? payment.prepay || 0 : 0;
    return {
      prepaid,
      due: Math.max(share - prepaid, 0),
      refund: Math.max(prepaid - share, 0),
    };
  };

  const results = members.map((member) => {
    const labels = details
      .filter((p) => p.payer === member)
      .map((p) => `${p.round}차 결제`);

    const totals = details.reduce(
      (acc, p) => {
        const s = getSettlement(p, member);
        acc.prepaid += s.prepaid;
        acc.due += s.due;
        acc.refund += s.refund;

        if (p.payer === member && page === "prepay") {
          acc.refundToOthers += p.participants.reduce((sum, m) => {
            if (m === member) return sum;
            return sum + Math.max((p.prepay || 0) - (p.shares[m] || 0), 0);
          }, 0);
        }
        return acc;
      },
      { prepaid: 0, due: 0, refund: 0, refundToOthers: 0 }
    );

    return { member, labels, ...totals };
  });

  // 같은 보내는 사람/받는 사람이 여러 차수에 겹치면 한 줄로 합침
  const transferMap = {};
  details.forEach((p) => {
    p.participants.forEach((member) => {
      if (member === p.payer) return;

      const share = p.shares[member] || 0;
      const prepaid = page === "prepay" ? p.prepay || 0 : 0;
      const diff = share - prepaid;
      if (!diff) return;

      const from = diff > 0 ? member : p.payer;
      const to = diff > 0 ? p.payer : member;
      const key = `${from}→${to}`;

      if (!transferMap[key])
        transferMap[key] = { from, to, rounds: [], amount: 0 };

      transferMap[key].rounds.push(`${p.round}차`);
      transferMap[key].amount += Math.abs(diff);
    });
  });
  const transfers = Object.values(transferMap);

  const paymentText = details.length
    ? details
        .map((p) => {
          const alcoholInfo = p.alcohol
            ? `- 술값 대상: ${p.drinkers.length}명 (${p.drinkers.join(", ")})\n- 술값 제외: ${p.noAlcohol.length ? p.noAlcohol.join(", ") : "없음"}`
            : "- 술값 대상: 없음";
          const prepayInfo =
            page === "prepay"
              ? `\n- 선입금: 1인당 ${money(p.prepay || 0)}\n- 선입금 수령자: ${p.payer}`
              : "";

          return `${p.round}차 ${p.shop}\n- 총금액: ${money(p.amount)}\n- 술값: ${money(p.alcohol)}\n- 일반금액: ${money(p.amount - p.alcohol)}\n- 결제자: ${p.payer}${prepayInfo}\n- 참석인원: ${p.participants.length}명\n- 참석자: ${p.participants.join(", ")}\n${alcoholInfo}`;
        })
        .join("\n\n")
    : "결제 내역 없음";

  const personalText = results
    .map((r) => {
      const label = r.labels.length ? ` (${r.labels.join(", ")})` : "";
      if (page === "normal") return `${r.member}${label}: ${money(r.due)}`;

      let text = `${r.member}${label}: 선입금 ${money(r.prepaid)} / 추가 납부 ${money(r.due)}`;
      if (r.refund > 0) text += ` / 돌려받기 ${money(r.refund)}`;
      if (r.refundToOthers > 0) text += ` / 환급해야 함 ${money(r.refundToOthers)}`;
      return text;
    })
    .join("\n");

  const transferText = transfers.length
    ? transfers
        .map(
          (t) =>
            `${t.rounds.join(",")} ${t.from} → ${t.to} : ${money(t.amount)}`
        )
        .join("\n")
    : "정산할 금액 없음";

  const settlementText = `
🍺 봉함의 정산 프로그램 - ${page === "normal" ? "일반 정산" : "선입금 정산"}

총액: ${money(total)}
${page === "prepay" ? "\n※ 선입금은 해당 차수 결제자에게 미리 낸 금액으로 계산합니다.\n" : ""}
[차수별 결제/참석자]
${paymentText}

[개인별 정산]
${personalText}

[송금 정리]
${transferText}
`.trim();

  const copySettlement = async () => {
    try {
      await navigator.clipboard.writeText(settlementText);
      alert("정산 결과가 복사되었습니다.");
    } catch {
      alert("복사하지 못했습니다. 아래 결과를 직접 선택해서 복사해줘.");
    }
  };

  const downloadSettlement = () => {
    const blob = new Blob([settlementText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `봉함의_${page === "normal" ? "일반정산" : "선입금정산"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <h1>🍺 봉함의 정산 프로그램</h1>

      <div className="page-switch">
        <button
          className={page === "normal" ? "active" : ""}
          onClick={() => switchPage("normal")}
        >
          일반 정산
        </button>
        <button
          className={page === "prepay" ? "active" : ""}
          onClick={() => switchPage("prepay")}
        >
          선입금 정산
        </button>
      </div>

      {page === "prepay" && (
        <div className="page-note">
          차수별로 1인당 선입금 금액을 설정합니다. 선입금은 해당 차수 결제자에게 미리 낸 금액으로 계산됩니다.
        </div>
      )}

      <section>
        <h2>참석자 설정</h2>
        <div className="mode-buttons">
          <button
            className={mode === "count" ? "active" : ""}
            onClick={() => changeMode("count")}
          >
            숫자로 관리
          </button>
          <button
            className={mode === "name" ? "active" : ""}
            onClick={() => changeMode("name")}
          >
            이름으로 관리
          </button>
        </div>

        {mode === "count" ? (
          <>
            <div className="counter">
              <button onClick={decreaseCount}>-</button>
              <strong>{count}명</strong>
              <button onClick={() => setCount((v) => v + 1)}>+</button>
            </div>
            <p className="member-list">전체 인원: {members.join(", ")}</p>
          </>
        ) : (
          <>
            <div className="name-input">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addName()}
                placeholder="참석자 이름"
              />
              <button onClick={addName}>추가</button>
            </div>
            <div className="name-list">
              {names.map((name) => (
                <div className="name-item" key={name}>
                  <span>{name}</span>
                  <button onClick={() => removeName(name)}>삭제</button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section>
        <h2>해당 차수 참석자</h2>
        <div className="participant-actions">
          <button type="button" onClick={() => setParticipants([...members])}>
            전체 선택
          </button>
          <button
            type="button"
            onClick={() => {
              setParticipants([]);
              setNoAlcohol([]);
              setPayer("");
            }}
          >
            전체 해제
          </button>
        </div>
        <div className="participant-list">
          {members.map((member) => (
            <button
              type="button"
              key={member}
              className={participants.includes(member) ? "selected" : ""}
              onClick={() => toggleParticipant(member)}
            >
              {member}
            </button>
          ))}
        </div>
      </section>

      <section className="top-card">
        <h2>{page === "normal" ? "결제 추가" : "선입금 + 결제 추가"}</h2>

        {page === "prepay" && (
          <div className="prepay-box">
            <label>선입금 1인당 금액</label>
            <input
              type="text"
              inputMode="numeric"
              value={formatAmountInput(prepay)}
              onChange={(e) => setPrepay(rawAmountInput(e.target.value))}
              placeholder="예: 30,000"
            />
            <p className="helper-text">
              해당 차수 참석자가 결제자에게 미리 낸 금액을 입력해줘.
            </p>
          </div>
        )}

        <label>가게 이름</label>
        <input
          value={shop}
          onChange={(e) => setShop(e.target.value)}
          placeholder="예: 펀비어"
        />

        <label>금액 · 술값 포함 총액</label>
        <input
          type="text"
          inputMode="numeric"
          value={formatAmountInput(amount)}
          onChange={(e) => setAmount(rawAmountInput(e.target.value))}
          placeholder="예: 120,000"
        />

        <label>결제자</label>
        <select value={payer} onChange={(e) => setPayer(e.target.value)}>
          <option value="">결제자 선택</option>
          {participants.map((member) => (
            <option key={member} value={member}>
              {member}
            </option>
          ))}
        </select>

        <div className="alcohol-box">
          <label>술값 (술값 예외 필요 시, 입력)</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatAmountInput(alcohol)}
            onChange={(e) => {
              const value = rawAmountInput(e.target.value);
              setAlcohol(value);
              if (Number(value) <= 0) setNoAlcohol([]);
            }}
            placeholder="술값 예외가 필요 없으면 0 또는 빈칸"
          />

          {Number(alcohol) > 0 && (
            <>
              <p className="helper-text">술을 마시지 않은 참석자를 선택해줘.</p>
              <div className="participant-list alcohol-exception-list">
                {participants.map((member) => (
                  <button
                    type="button"
                    key={member}
                    className={noAlcohol.includes(member) ? "selected" : ""}
                    onClick={() => toggleNoAlcohol(member)}
                  >
                    {member}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button className="primary-btn" onClick={addPayment}>
          결제 추가
        </button>
      </section>

      <section>
        <h2>결제 목록</h2>
        {!details.length && <p className="empty">아직 결제 내역이 없습니다.</p>}
        {details.map((p) => (
          <div className="payment-item" key={p.id}>
            <div>
              <strong>{p.round}차 {p.shop}</strong><br />
              <span>총 {money(p.amount)} / 술값 {money(p.alcohol)}</span><br />
              {page === "prepay" && (
                <><span>선입금 1인당 {money(p.prepay || 0)}</span><br /></>
              )}
              <span>{p.payer} 결제 / {p.participants.length}명 참석</span><br />
              <span>참석자: {p.participants.join(", ")}</span>
              {p.alcohol > 0 && (
                <><br /><span>술값 제외: {p.noAlcohol.length ? p.noAlcohol.join(", ") : "없음"}</span></>
              )}
            </div>
            <button
              className="delete-btn"
              onClick={() =>
                setCurrentPayments((prev) => prev.filter((x) => x.id !== p.id))
              }
            >
              삭제
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>정산 요약</h2>
        <div className="summary"><p>총액</p><strong>{money(total)}</strong></div>
      </section>

      <section>
        <h2>개인별 정산</h2>
        {results.map((r) => (
          <div className="personal-card" key={r.member}>
            <div>
              <strong className="person-name">{r.member}</strong>
              {!!r.labels.length && <div className="paid-badge">🟢 {r.labels.join(", ")}</div>}
            </div>
            {page === "normal" ? (
              <div className="pay-amount">
                <span>내야 할 금액</span>
                <strong>{money(r.due)}</strong>
              </div>
            ) : (
              <div className="prepay-result">
                <span>선입금 {money(r.prepaid)}</span>
                <strong>추가 납부 {money(r.due)}</strong>
                {r.refund > 0 && <span className="refund">돌려받기 {money(r.refund)}</span>}
                {r.refundToOthers > 0 && <span className="refund-out">환급해야 함 {money(r.refundToOthers)}</span>}
              </div>
            )}
          </div>
        ))}
      </section>

      <section>
        <h2>송금 정리</h2>
        {!transfers.length && <p className="empty">정산할 금액이 없습니다.</p>}
        {transfers.map((t) => (
          <div className="transfer-item" key={`${t.from}-${t.to}`}>
            <span>{t.rounds.join(",")} {t.from} → {t.to}</span>
            <strong>{money(t.amount)}</strong>
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
