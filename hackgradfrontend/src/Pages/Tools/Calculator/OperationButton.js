import { ACTIONS } from "../Calculator.js"

export default function OperationButton({ dispatch, operation }) {
  return (
    <button
      className="operation-btn"
      onClick={() =>
        dispatch({ type: ACTIONS.CHOOSE_OPERATION, payload: { operation } })
      }
    >
      {operation}
    </button>
  )
}