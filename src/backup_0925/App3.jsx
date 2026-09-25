import { useState } from "react";
import "./App.css";

const money = (value) => `${Math.round(value).toLocaleString()}원`;

/*
  금액을 인원수대로 정확하게 분배한다.
  애매하면 1원씩 반올림해서 올림
*/
const splitMoney = (amount, people) => {
  const result = Object.fromEntries(
    people.map((person) => [person, 0])
  );

  if (!people.length || amount <= 0) return result;

  const perPerson = Math.ceil(amount / people.length);

  people.forEach((person) => {
    result[person] = perPerson;
  });

  return result;
};

function App() {
  const [mode, setMode] = useState("count");
  const [count, setCount] = useState(4);
  const [names, setNames] = useState(["철수", "영희", "민수"]);
  const [newName, setNewName] = useState("");

  const [shop, setShop] = useState("");
  const [amount, setAmount] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [payer, setPayer] = useState("");
  const [participants, setParticipants] = useState([]);
  const [noAlcohol, setNoAlcohol] = useState([]);
  const [payments, setPayments] = useState([]);

  const members =
    mode === "count"
      ? Array.from({ length: count }, (_, index) => `${index + 1}번`)
      : names;

  const resetPaymentForm = () => {
    setShop("");
    setAmount("");
    setAlcohol("");
    setPayer("");
    setParticipants([]);
    setNoAlcohol([]);
  };

  const changeMode = (nextMode) => {
    if (nextMode === mode) return;

    if (
      payments.length > 0 &&
      !window.confirm("참석자 방식을 변경하면 기존 결제 내역이 삭제됩니다.")
    ) {
      return;
    }

    setMode(nextMode);
    setPayments([]);
    resetPaymentForm();
  };

  const increaseCount = () => {
    setCount((current) => current + 1);
  };

  const decreaseCount = () => {
    if (count <= 1) return;

    const removedMember = `${count}번`;
    const memberIsUsed = payments.some(
      (payment) =>
        payment.payer === removedMember ||
        payment.participants.includes(removedMember)
    );

    if (memberIsUsed) {
      alert(`${removedMember}이 포함된 결제 내역을 먼저 삭제해줘.`);
      return;
    }

    setCount((current) => current - 1);
    setParticipants((current) =>
      current.filter((member) => member !== removedMember)
    );
    setNoAlcohol((current) =>
      current.filter((member) => member !== removedMember)
    );

    if (payer === removedMember) setPayer("");
  };

  const addName = () => {
    const value = newName.trim();

    if (!value) return;
    if (names.includes(value)) {
      alert("이미 등록된 이름이야.");
      return;
    }

    setNames([...names, value]);
    setNewName("");
  };

  const removeName = (name) => {
    const memberIsUsed = payments.some(
      (payment) =>
        payment.payer === name || payment.participants.includes(name)
    );

    if (memberIsUsed) {
      alert(`${name}이 포함된 결제 내역을 먼저 삭제해줘.`);
      return;
    }

    setNames(names.filter((member) => member !== name));
    setParticipants(participants.filter((member) => member !== name));
    setNoAlcohol(noAlcohol.filter((member) => member !== name));

    if (payer === name) setPayer("");
  };

  const toggleParticipant = (member) => {
    if (participants.includes(member)) {
      setParticipants(participants.filter((item) => item !== member));
      setNoAlcohol(noAlcohol.filter((item) => item !== member));
      return;
    }

    setParticipants([...participants, member]);
  };

  const toggleNoAlcohol = (member) => {
    setNoAlcohol(
      noAlcohol.includes(member)
        ? noAlcohol.filter((item) => item !== member)
        : [...noAlcohol, member]
    );
  };

  const selectAllParticipants = () => {
    setParticipants([...members]);
  };

  const clearParticipants = () => {
    setParticipants([]);
    setNoAlcohol([]);
  };

  const addPayment = () => {
    const totalAmount = Math.round(Number(amount));
    const alcoholAmount = Math.round(Number(alcohol || 0));

    if (!shop.trim() || totalAmount <= 0 || !payer) {
      alert("가게 이름, 총금액, 결제자를 입력해줘.");
      return;
    }

    if (participants.length === 0) {
      alert("해당 차수 참석자를 선택해줘.");
      return;
    }

    if (!participants.includes(payer)) {
      alert("결제자는 해당 차수 참석자에 포함되어야 해.");
      return;
    }

    if (alcoholAmount < 0 || alcoholAmount > totalAmount) {
      alert("술값은 0원 이상이며 총금액보다 클 수 없어.");
      return;
    }

    const drinkers = participants.filter(
      (member) => !noAlcohol.includes(member)
    );

    if (alcoholAmount > 0 && drinkers.length === 0) {
      alert("술값을 분담할 사람을 1명 이상 남겨줘.");
      return;
    }

    setPayments([
      ...payments,
      {
        id: Date.now(),
        shop: shop.trim(),
        amount: totalAmount,
        alcohol: alcoholAmount,
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
      (member) => !payment.noAlcohol.includes(member)
    );

    const normalShares = splitMoney(normalAmount, payment.participants);
    const alcoholShares = splitMoney(payment.alcohol, drinkers);

    return Object.fromEntries(
      payment.participants.map((member) => [
        member,
        (normalShares[member] || 0) + (alcoholShares[member] || 0),
      ])
    );
  };

  const details = payments.map((payment, index) => ({
    ...payment,
    round: index + 1,
    drinkers: payment.participants.filter(
      (member) => !payment.noAlcohol.includes(member)
    ),
    shares: calculateShares(payment),
  }));

  const total = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  const results = members.map((member) => {
    const labels = details
      .filter((payment) => payment.payer === member)
      .map((payment) => `${payment.round}차 결제`);

    /*
      본인이 결제한 차수는 0원 처리하고,
      다른 사람이 결제한 차수에서 본인 몫만 합산한다.
    */
    const needToPay = details.reduce((sum, payment) => {
      if (payment.payer === member) return sum;
      return sum + (payment.shares[member] || 0);
    }, 0);

    return {
      member,
      labels,
      needToPay,
    };
  });

  /*
    같은 보내는 사람과 받는 사람이 여러 차수에 겹치면
    차수와 금액을 한 줄로 합친다.
  */
  const transferMap = {};

  details.forEach((payment) => {
    payment.participants.forEach((member) => {
      if (member === payment.payer) return;

      const transferAmount = payment.shares[member] || 0;
      if (transferAmount <= 0) return;

      const key = `${member}→${payment.payer}`;

      if (!transferMap[key]) {
        transferMap[key] = {
          from: member,
          to: payment.payer,
          rounds: [],
          amount: 0,
        };
      }

      transferMap[key].rounds.push(`${payment.round}차`);
      transferMap[key].amount += transferAmount;
    });
  });

  const transfers = Object.values(transferMap);

  const paymentText =
    details.length === 0
      ? "결제 내역 없음"
      : details
          .map((payment) => {
            const alcoholInfo =
              payment.alcohol > 0
                ? `- 술값 대상: ${payment.drinkers.length}명 (${payment.drinkers.join(
                    ", "
                  )})
- 술값 제외: ${
                    payment.noAlcohol.length
                      ? payment.noAlcohol.join(", ")
                      : "없음"
                  }`
                : "- 술값 대상: 없음";

            return `${payment.round}차 ${payment.shop}
- 총금액: ${money(payment.amount)}
- 술값: ${money(payment.alcohol)}
- 일반금액: ${money(payment.amount - payment.alcohol)}
- 결제자: ${payment.payer}
- 참석인원: ${payment.participants.length}명
- 참석자: ${payment.participants.join(", ")}
${alcoholInfo}`;
          })
          .join("\n\n");

  const personalText = results
    .map(
      (result) =>
        `${result.member}${
          result.labels.length ? ` (${result.labels.join(", ")})` : ""
        }: ${money(result.needToPay)}`
    )
    .join("\n");

  const transferText =
    transfers.length === 0
      ? "정산할 금액 없음"
      : transfers
          .map(
            (transfer) =>
              `${transfer.rounds.join(",")} ${transfer.from} → ${
                transfer.to
              } : ${money(transfer.amount)}`
          )
          .join("\n");

  const settlementText = `
🍺 봉함의 정산 프로그램

총액: ${money(total)}

[차수별 결제/참석자]
${paymentText}

[개인별 내야 할 금액]
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
    const blob = new Blob([settlementText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "봉함의_정산결과.txt";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <h1>🍺 봉함의 정산 프로그램</h1>

      {/* 1. 전체 참석자 먼저 설정 */}
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
              <button onClick={increaseCount}>+</button>
            </div>

            <p className="member-list">전체 인원: {members.join(", ")}</p>
          </>
        ) : (
          <>
            <div className="name-input">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addName();
                }}
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

      {/* 2. 이번 차수에 실제 참석한 사람 선택 */}
      <section>
        <h2>해당 차수 참석자</h2>

        <div className="participant-actions">
          <button type="button" onClick={selectAllParticipants}>
            전체 선택
          </button>

          <button type="button" onClick={clearParticipants}>
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

      {/* 3. 결제 정보 입력 */}
      <section className="top-card">
        <h2>결제 추가</h2>

        <label>가게 이름</label>
        <input
          value={shop}
          onChange={(event) => setShop(event.target.value)}
          placeholder="예: 펀비어"
        />

        <label>금액 · 술값 포함 총액</label>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="예: 120000"
        />

        <label>결제자</label>
        <select
          value={payer}
          onChange={(event) => setPayer(event.target.value)}
        >
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
            type="number"
            min="0"
            value={alcohol}
            onChange={(event) => {
              setAlcohol(event.target.value);

              if (Number(event.target.value) <= 0) {
                setNoAlcohol([]);
              }
            }}
            placeholder="술값 예외가 필요 없으면 0 또는 빈칸"
          />

          {Number(alcohol) > 0 && (
            <>
              <p className="helper-text">
                술을 마시지 않은 참석자를 선택해줘.
              </p>

              {participants.length === 0 ? (
                <p className="empty">먼저 해당 차수 참석자를 선택해줘.</p>
              ) : (
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
              )}
            </>
          )}
        </div>

        <button className="primary-btn" onClick={addPayment}>
          결제 추가
        </button>
      </section>

      <section>
        <h2>결제 목록</h2>

        {details.length === 0 && (
          <p className="empty">아직 결제 내역이 없습니다.</p>
        )}

        {details.map((payment) => (
          <div className="payment-item" key={payment.id}>
            <div>
              <strong>
                {payment.round}차 {payment.shop}
              </strong>

              <br />

              <span>
                총 {money(payment.amount)} / 술값 {money(payment.alcohol)}
              </span>

              <br />

              <span>
                {payment.payer} 결제 / {payment.participants.length}명 참석
              </span>

              <br />

              <span>참석자: {payment.participants.join(", ")}</span>

              {payment.alcohol > 0 && (
                <>
                  <br />
                  <span>
                    술값 제외:{" "}
                    {payment.noAlcohol.length
                      ? payment.noAlcohol.join(", ")
                      : "없음"}
                  </span>
                </>
              )}
            </div>

            <button
              className="delete-btn"
              onClick={() =>
                setPayments(
                  payments.filter((item) => item.id !== payment.id)
                )
              }
            >
              삭제
            </button>
          </div>
        ))}
      </section>

      <section>
        <h2>정산 요약</h2>

        <div className="summary">
          <p>총액</p>
          <strong>{money(total)}</strong>
        </div>
      </section>

      <section>
        <h2>개인별 정산</h2>

        {results.map((result) => (
          <div className="personal-card" key={result.member}>
            <div>
              <strong className="person-name">{result.member}</strong>

              {result.labels.length > 0 && (
                <div className="paid-badge">
                  🟢 {result.labels.join(", ")}
                </div>
              )}
            </div>

            <div className="pay-amount">
              <span>내야 할 금액</span>
              <strong>{money(result.needToPay)}</strong>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2>송금 정리</h2>

        {transfers.length === 0 && (
          <p className="empty">정산할 금액이 없습니다.</p>
        )}

        {transfers.map((transfer) => (
          <div
            className="transfer-item"
            key={`${transfer.from}-${transfer.to}`}
          >
            <span>
              {transfer.rounds.join(",")} {transfer.from} → {transfer.to}
            </span>

            <strong>{money(transfer.amount)}</strong>
          </div>
        ))}
      </section>

      <section>
        <h2>정산 결과 공유</h2>

        <textarea
          className="settlement-text"
          value={settlementText}
          readOnly
        />

        <div className="share-buttons">
          <button onClick={copySettlement}>복사하기</button>
          <button onClick={downloadSettlement}>다운로드</button>
        </div>
      </section>
    </div>
  );
}

export default App;
