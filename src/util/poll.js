// polling system
// const poll = async function (fn, ms) {
// 	let result = await fn();
// 	console.log('Poll result:', result);
// 	while (fnCondition(result).status !== 200) {
// 		await wait(ms);
// 		result = await fn();
// 	}
// 	return result;
// };

/**
 * 
 * @param {function} fn 
 * @param {number} timeInterval 
 */
const poll = (fn = () => true, timeInterval, timeout) => new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
        const result = await fn()
        if (result === true) {
            resolve()
            clearInterval(interval)
        }
    }, timeInterval)

    setTimeout(() => {
        clearInterval(interval)
        const e = new Error('Polling timed out')
        e.type = 'TIMED_OUT'
        reject(e)
    }, timeout)
})

module.exports = {
    poll
}