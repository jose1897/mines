import './cell.js';
import LogicGrid from './logic-grid.js';

export default class Grid extends HTMLElement {

	constructor() {
		super();
		this.width = parseInt(this.getAttribute('width'), 10);
		this.height = parseInt(this.getAttribute('height'), 10);
		this.mineCount = parseInt(this.getAttribute('mines'), 10);

		this.logicGrid = new LogicGrid(this.width, this.height, this.mineCount);

		this.innerHTML = `
			<table><tbody></tbody></table>
			<div><span id="flagged">0</span> flagged out of ${this.mineCount}</div>
		`;
		const tbody = this.querySelector('tbody'),
			flaggedSpan = this.querySelector('#flagged');

		this.cellements = [];
		for (let y = 0; y < this.height; ++y) {
			const row = this.cellements[y] = [],
				tr = document.createElement('tr');
			tbody.appendChild(tr);
			for (let x = 0; x < this.width; ++x) {
				const td = document.createElement('td');
				const cellement = row[x] = document.createElement('mines-cell');
				cellement.x = x;
				cellement.y = y;
				td.appendChild(cellement);
				tr.appendChild(td);
				cellement.addEventListener('contextmenu', e => {
					e.preventDefault();
					cellement.flagged = !cellement.flagged;
					let f = 0;
					for (const cell of this.allCells())
						if (cell.flagged) ++f;
					flaggedSpan.innerHTML = f;
				});
				cellement.addEventListener('click', e => {
					e.preventDefault();
					if (e.which != 1 || cellement.flagged)
						return;
					if (cellement.revealed) {
						let n = 0;
						for (const neighbour of this.neighbourCells(cellement))
							if (neighbour.flagged) ++n;
						const cell = this.logicGrid.cell(x, y);
						if (n == cell.number)
							for (const neighbour of this.neighbourCells(cellement))
								if (!neighbour.flagged)
									this.reveal(neighbour);
						else console.log(`Not revealing as number is ${cell.number} but only ${n} flags`, cell);
					} else
						this.reveal(cellement);
				});
			}
		}

		button(this, 'Reveal', () => {
			for (const cell of this.allCells())
				cell.revealed = true;
		});
	}

	connectedCallback() {
		this.render();
	}

	cell(x, y) {
		return this.cellements[y]?.[x]
			|| { knownSafe: true };
	}

	// todo: collapse into neighbourCells?
	*neighbours(x, y) {
		for (let dx = -1; dx < 2; ++dx)
			for (let dy = -1; dy < 2; ++dy)
				if (dx || dy) {
					const nx = x + dx, ny = y + dy;
					if (nx < this.width && nx >= 0 && ny < this.height && ny >= 0)
						yield [ nx, ny ];
				}
	}

	*neighbourCells(cell) {
		for (const [nx, ny] of this.neighbours(cell.x, cell.y))
			yield this.cell(nx, ny);
	}

	*allCells() {
		for (const row of this.cellements)
			for (const cell of row)
				yield cell;
	}

	reveal(cell) {
		const logicCell = this.logicGrid.cell(cell.x, cell.y);

		// rig it so the first click is always zero
		if (!this.revealedAny) {
			this.logicGrid.makeSafe(logicCell);
			for (const cell of this.logicGrid.neighbourCells(logicCell))
				this.logicGrid.makeSafe(cell);
			this.revealedAny = true;
		}

		if (!logicCell || logicCell.revealed) return;
		console.log(`Revealing (${cell?.x}, ${cell?.y})`, logicCell, cell);
		this.logicGrid.reveal(logicCell);
		cell.revealed = true;
		// TODO: catch unknown mines:
		if (logicCell.knownMine) {
			this.classList.add('gameOver');
			this.logicGrid = this.logicGrid.generatePossibleMines();
		}
		this.render();
	}

	render() {
		for (const cell of this.allCells()) {
			const logicCell = this.logicGrid.cell(cell.x, cell.y);
			cell.knownMine = logicCell.knownMine;
			cell.knownSafe = logicCell.knownSafe;
			cell.revealed = logicCell.revealed;
			cell.number = logicCell.number;
		}
	}

}

window.customElements.define('mines-grid', Grid);

function button(parent, text, callback) {
	const button = document.createElement('button');
	button.setAttribute('type', button);
	button.addEventListener('click', callback);
	button.appendChild(document.createTextNode(text));
	parent.appendChild(button);
	return button;
}