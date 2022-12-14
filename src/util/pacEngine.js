const { v4 } = require('uuid');
const WebSocket = require('ws')
const EventEmitter = require('events')

const COMMS_URL = process.env.PACCOMMS_URL ? `${process.env.PACCOMMS_URL}/socket` : 'ws://localhost:8080/socket'

class PacTask extends EventEmitter {
	constructor({ type, opts, eventName }) {
		super();
		this.type = type;
		this.opts = opts;
		this.eventName = eventName;
		this.closeEventName = `close::${v4()}`;
	}

	execute() {
		const connectionId = v4();
		const socket = new WebSocket(`${COMMS_URL}?connId=${connectionId}`);
		const taskId = v4();

		console.log('TaskID:', taskId);
		socket.addEventListener('open', () => {
			const message = {
				task_id: taskId,
				type: this.type,
				data: this.opts,
			};

			socket.send(JSON.stringify(message));
		});

		socket.addEventListener('message', (message) => {
			const msgObject = JSON.parse(JSON.parse(message.data)); // What the fuck?
			console.log('Received from websocket:', msgObject);
			if (msgObject.task_id === taskId) {
				let data = msgObject.data;
				if (typeof data === 'string') {
					data = JSON.parse(data);
				}
				this.emit(this.eventName, data);
			}
		});

		this.on(this.closeEventName, () => {
			console.log('Disconnnecting socket');
			socket.close();
            this.removeAllListeners(this.eventName)
		});
	}

	done() {
		this.emit(this.closeEventName);
	}
}

class GenerateTask extends PacTask {
	constructor({ sessionId }) {
		super({
			type: 'GENERATE',
			eventName: 'stepGenerated',
			opts: {
				session_id: sessionId,
			},
		});
	}
}

class InstructTask extends PacTask {
	constructor({ sessionId, instruction, fromScratch }) {
		super({
			type: 'INSTRUCT',
			eventName: 'instructDone',
			opts: {
				session_id: sessionId,
				instruction,
				from_scratch: fromScratch,
			},
		});
	}
}

module.exports = {
    GenerateTask,
    InstructTask
}