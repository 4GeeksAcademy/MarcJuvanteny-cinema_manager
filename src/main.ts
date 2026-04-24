type SeatState = 0 | 1;
type CinemaSala = SeatState[][];
type Seat = { row: number; col: number };
type BookingResult = { success: boolean; message: string; updatedSala: CinemaSala };
type Stats = { total: number; occupied: number; available: number };

declare const process: { argv: string[] };

const FREE: SeatState = 0;
const TAKEN: SeatState = 1;

function initializeSala(rows: number, cols: number): CinemaSala {
  if (rows <= 0 || cols <= 0) throw new Error("Rows and columns must be greater than zero.");
  const sala: CinemaSala = [];
  for (let r = 0; r < rows; r += 1) {
    const row: SeatState[] = [];
    for (let c = 0; c < cols; c += 1) row.push(FREE);
    sala.push(row);
  }
  return sala;
}

function randomHalfFull(sala: CinemaSala): CinemaSala {
  const next: CinemaSala = [];
  for (let r = 0; r < sala.length; r += 1) {
    const row: SeatState[] = [];
    for (let c = 0; c < sala[r].length; c += 1) row.push(Math.random() < 0.5 ? TAKEN : FREE);
    next.push(row);
  }
  return next;
}

function renderSala(sala: CinemaSala): void {
  if (!sala.length || !sala[0].length) return;
  let header = "    ";
  for (let c = 0; c < sala[0].length; c += 1) header += `${String(c).padStart(2, " ")} `;
  console.log(header.trimEnd());

  for (let r = 0; r < sala.length; r += 1) {
    let line = `${String(r).padStart(2, " ")} |`;
    for (let c = 0; c < sala[r].length; c += 1) line += ` ${(sala[r][c] === FREE ? "L" : "X").padStart(2, " ")}`;
    console.log(line);
  }
}

function bookSeat(sala: CinemaSala, row: number, col: number): BookingResult {
  const inBounds = row >= 0 && row < sala.length && col >= 0 && col < sala[0].length;
  if (!inBounds) return { success: false, message: "Invalid coordinates.", updatedSala: sala };
  if (sala[row][col] === TAKEN) return { success: false, message: "Seat already occupied.", updatedSala: sala };

  const next: CinemaSala = [];
  for (let r = 0; r < sala.length; r += 1) {
    const rowCopy: SeatState[] = [];
    for (let c = 0; c < sala[r].length; c += 1) rowCopy.push(r === row && c === col ? TAKEN : sala[r][c]);
    next.push(rowCopy);
  }
  return { success: true, message: "Seat booked successfully.", updatedSala: next };
}

function getStatistics(sala: CinemaSala): Stats {
  let total = 0;
  let occupied = 0;
  for (let r = 0; r < sala.length; r += 1) {
    for (let c = 0; c < sala[r].length; c += 1) {
      total += 1;
      if (sala[r][c] === TAKEN) occupied += 1;
    }
  }
  return { total, occupied, available: total - occupied };
}

function findContiguousSeats(sala: CinemaSala): [Seat, Seat] | null {
  for (let r = 0; r < sala.length; r += 1) {
    for (let c = 0; c < sala[r].length - 1; c += 1) {
      if (sala[r][c] === FREE && sala[r][c + 1] === FREE) return [{ row: r, col: c }, { row: r, col: c + 1 }];
    }
  }
  return null;
}

function parseSeatArg(args: string[]): Seat | null {
  if (!args.length) return null;
  const raw = args[0].includes(",") ? args[0].split(",") : args.slice(0, 2);
  if (raw.length < 2) return null;
  const row = Number.parseInt(raw[0], 10);
  const col = Number.parseInt(raw[1], 10);
  return Number.isNaN(row) || Number.isNaN(col) ? null : { row, col };
}

function runTestSuite(): void {
  console.log("=== Suite de Pruebas ===");
  let sala = randomHalfFull(initializeSala(8, 10));
  console.log("\n1) Sala 8x10 semillena aleatoria");
  renderSala(sala);

  const seat = parseSeatArg(process.argv.slice(2)) ?? { row: 2, col: 3 };
  console.log(`\n2) Reserva intentada (${seat.row}, ${seat.col})`);
  let result = bookSeat(sala, seat.row, seat.col);
  console.log(result.message);
  sala = result.updatedSala;
  renderSala(sala);

  console.log(`\n3) Reserva repetida (${seat.row}, ${seat.col})`);
  result = bookSeat(sala, seat.row, seat.col);
  console.log(result.message);

  console.log("\n4) Primer par contiguo libre");
  const pair = findContiguousSeats(sala);
  console.log(pair ? `(${pair[0].row}, ${pair[0].col}) y (${pair[1].row}, ${pair[1].col})` : "No se encontraron asientos contiguos libres.");

  console.log("\n5) Estadisticas finales");
  console.log(getStatistics(sala));
}

runTestSuite();

export { initializeSala, renderSala, bookSeat, getStatistics, findContiguousSeats };
