import React, { useState } from 'react'
import { X, Calculator, Delete, RotateCcw } from 'lucide-react'
import { CalculatorType } from '../lib/assessmentService'

interface AssessmentCalculatorDrawerProps {
  type: CalculatorType
  isOpen: boolean
  onClose: () => void
}

export const AssessmentCalculatorDrawer: React.FC<AssessmentCalculatorDrawerProps> = ({
  type,
  isOpen,
  onClose,
}) => {
  const [display, setDisplay] = useState('0')
  const [memory, setMemory] = useState<number | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)
  const [pendingOp, setPendingOp] = useState<string | null>(null)

  if (!isOpen || type === 'none') return null

  // Calculator logic for Basic & Scientific
  const handleDigit = (digit: string) => {
    if (waitingForOperand || display === '0') {
      setDisplay(digit)
      setWaitingForOperand(false)
    } else {
      setDisplay(display + digit)
    }
  }

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.')
      setWaitingForOperand(false)
      return
    }
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setMemory(null)
    setPendingOp(null)
    setWaitingForOperand(false)
  }

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1))
    } else {
      setDisplay('0')
    }
  }

  const handleOperator = (nextOp: string) => {
    const inputValue = parseFloat(display)

    if (memory === null) {
      setMemory(inputValue)
    } else if (pendingOp) {
      const result = calculate(memory, inputValue, pendingOp)
      setDisplay(String(result))
      setMemory(result)
    }

    setWaitingForOperand(true)
    setPendingOp(nextOp)
  }

  const handleEqual = () => {
    const inputValue = parseFloat(display)
    if (pendingOp && memory !== null) {
      const result = calculate(memory, inputValue, pendingOp)
      setDisplay(String(result))
      setMemory(null)
      setPendingOp(null)
      setWaitingForOperand(true)
    }
  }

  const handleScientificFunc = (func: string) => {
    const val = parseFloat(display)
    let res = val
    switch (func) {
      case 'sin':
        res = Math.sin((val * Math.PI) / 180)
        break
      case 'cos':
        res = Math.cos((val * Math.PI) / 180)
        break
      case 'tan':
        res = Math.tan((val * Math.PI) / 180)
        break
      case 'sqrt':
        res = Math.sqrt(val)
        break
      case 'sq':
        res = val * val
        break
      case 'log':
        res = Math.log10(val)
        break
      case 'ln':
        res = Math.log(val)
        break
      case 'inv':
        res = val !== 0 ? 1 / val : 0
        break
      case 'neg':
        res = -val
        break
      case 'pi':
        res = Math.PI
        break
      default:
        break
    }
    setDisplay(String(Number(res.toFixed(8))))
    setWaitingForOperand(true)
  }

  const calculate = (first: number, second: number, op: string) => {
    switch (op) {
      case '+':
        return first + second
      case '-':
        return first - second
      case '×':
        return first * second
      case '÷':
        return second !== 0 ? first / second : 0
      case '^':
        return Math.pow(first, second)
      default:
        return second
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-2xl border border-slate-300 bg-white overflow-hidden flex flex-col w-[340px] sm:w-[380px] max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
      {/* Drawer Header */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold tracking-tight">
            {type === 'desmos'
              ? 'Desmos Graphing Tool'
              : type === 'scientific'
              ? 'Standard Scientific Calculator'
              : 'Arithmetic Calculator'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* If Desmos is configured */}
      {type === 'desmos' ? (
        <div className="flex-1 flex flex-col h-[440px] bg-slate-50">
          <iframe
            src="https://www.desmos.com/calculator?embed"
            title="Desmos Graphing Calculator"
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
          <div className="p-2 text-center text-[10px] text-slate-400 border-t border-slate-200">
            Powered by Desmos Graphing Suite • Standardized Testing Mode
          </div>
        </div>
      ) : (
        /* Built-in Scientific / Basic Calculator */
        <div className="p-4 space-y-3 bg-slate-50">
          {/* Display screen */}
          <div className="bg-slate-900 text-white rounded-xl p-3 text-right">
            <div className="text-[10px] text-slate-400 font-mono h-4 truncate">
              {memory !== null && pendingOp ? `${memory} ${pendingOp}` : ''}
            </div>
            <div className="text-2xl font-mono font-bold tracking-tight overflow-x-auto">
              {display}
            </div>
          </div>

          {/* Scientific Keypad Extension */}
          {type === 'scientific' && (
            <div className="grid grid-cols-5 gap-1.5 pt-1 text-[11px] font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => handleScientificFunc('sin')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                sin
              </button>
              <button
                type="button"
                onClick={() => handleScientificFunc('cos')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                cos
              </button>
              <button
                type="button"
                onClick={() => handleScientificFunc('tan')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                tan
              </button>
              <button
                type="button"
                onClick={() => handleScientificFunc('log')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                log
              </button>
              <button
                type="button"
                onClick={() => handleScientificFunc('ln')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                ln
              </button>

              <button
                type="button"
                onClick={() => handleScientificFunc('sqrt')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                √x
              </button>
              <button
                type="button"
                onClick={() => handleScientificFunc('sq')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                x²
              </button>
              <button
                type="button"
                onClick={() => handleOperator('^')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                xʸ
              </button>
              <button
                type="button"
                onClick={() => handleScientificFunc('inv')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                1/x
              </button>
              <button
                type="button"
                onClick={() => handleScientificFunc('pi')}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100"
              >
                π
              </button>
            </div>
          )}

          {/* Standard Keypad */}
          <div className="grid grid-cols-4 gap-2 text-xs font-bold">
            <button
              type="button"
              onClick={handleClear}
              className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 flex items-center justify-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>AC</span>
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="p-2.5 rounded-xl bg-slate-200/80 text-slate-700 hover:bg-slate-300 flex items-center justify-center"
            >
              <Delete className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleScientificFunc('neg')}
              className="p-2.5 rounded-xl bg-slate-200/80 text-slate-700 hover:bg-slate-300"
            >
              ±
            </button>
            <button
              type="button"
              onClick={() => handleOperator('÷')}
              className="p-2.5 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              ÷
            </button>

            <button
              type="button"
              onClick={() => handleDigit('7')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              7
            </button>
            <button
              type="button"
              onClick={() => handleDigit('8')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              8
            </button>
            <button
              type="button"
              onClick={() => handleDigit('9')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              9
            </button>
            <button
              type="button"
              onClick={() => handleOperator('×')}
              className="p-3 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              ×
            </button>

            <button
              type="button"
              onClick={() => handleDigit('4')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              4
            </button>
            <button
              type="button"
              onClick={() => handleDigit('5')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              5
            </button>
            <button
              type="button"
              onClick={() => handleDigit('6')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              6
            </button>
            <button
              type="button"
              onClick={() => handleOperator('-')}
              className="p-3 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              -
            </button>

            <button
              type="button"
              onClick={() => handleDigit('1')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              1
            </button>
            <button
              type="button"
              onClick={() => handleDigit('2')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              2
            </button>
            <button
              type="button"
              onClick={() => handleDigit('3')}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              3
            </button>
            <button
              type="button"
              onClick={() => handleOperator('+')}
              className="p-3 rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              +
            </button>

            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="p-3 col-span-2 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDecimal}
              className="p-3 rounded-xl bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-slate-50"
            >
              .
            </button>
            <button
              type="button"
              onClick={handleEqual}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="p-3 rounded-xl bg-blue-600 text-white font-extrabold hover:bg-blue-700 shadow-xs"
            >
              =
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssessmentCalculatorDrawer
