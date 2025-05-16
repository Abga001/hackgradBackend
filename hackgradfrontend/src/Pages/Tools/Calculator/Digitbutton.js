import { ACTIONS } from "../Calculator.js"

export default function DigitButton({ dispatch, digit }) {
  return (
    <button
      className="digit-btn"
      onClick={() => dispatch({ type: ACTIONS.ADD_DIGIT, payload: { digit } })}
    >
      {digit}
    </button>
  )
}