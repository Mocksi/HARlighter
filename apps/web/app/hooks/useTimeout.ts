export const useTimeout = (functionToCall: CallableFunction) => {
  let timeout: NodeJS.Timeout;
  const runTimeoutFunction = () => {
    timeout = setTimeout(() => {
      functionToCall()
      clearTimeout(timeout)
    }, 7000)
  }
  return runTimeoutFunction
}