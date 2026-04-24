type SeatState = 0 | 1;
type CinemaSala = SeatState[][];

declare const process: {
  argv: string[];
};

interface BookingResult {
  success: boolean;
  message: string;
  updatedSala: CinemaSala;
}

interface SeatCoordinates {
  row: number;
  col: number;
}

interface ContiguousSeatsResult {
  found: boolean;
  seats: [SeatCoordinates, SeatCoordinates] | null;
}

interface SalaStatistics {
  total: number;
  occupied: number;
  available: number;
}

interface CliBookingParseResult {
  seat: SeatCoordinates | null;
  message: string | null;
}

/**
 * Creates a cinema room matrix initialized with available seats (0).
 */
function initializeSala(rows: number, cols: number): CinemaSala {
  if (rows <= 0 || cols <= 0) {
    throw new Error("Rows and columns must be greater than zero.");
  }

  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0 as SeatState),
  );
}

/**
 * Renders the cinema room with row and column indexes.
 */
function renderSala(sala: CinemaSala): void {
  if (sala.length === 0 || sala[0].length === 0) {
    console.log("Sala is empty.");
    return;
  }

  const totalCols = sala[0].length;
  const header = `    ${Array.from({ length: totalCols }, (_, index) => String(index).padStart(2, " ")).join(" ")}`;

  console.log(header);
  sala.forEach((row, rowIndex) => {
    const renderedRow = row
      .map((seat) => (seat === 0 ? "L" : "X"))
      .map((label) => label.padStart(2, " "))
      .join(" ");
    console.log(`${String(rowIndex).padStart(2, " ")} | ${renderedRow}`);
  });
}

/**
 * Validates whether a seat coordinate is within room bounds.
 */
function isWithinBounds(sala: CinemaSala, row: number, col: number): boolean {
  return row >= 0 && row < sala.length && col >= 0 && col < sala[0].length;
}

/**
 * Books a seat if it exists and is currently available.
 * Uses immutable update and returns a new room matrix.
 */
function bookSeat(sala: CinemaSala, row: number, col: number): BookingResult {
  if (!isWithinBounds(sala, row, col)) {
    return {
      success: false,
      message: "Invalid coordinates.",
      updatedSala: sala,
    };
  }

  if (sala[row][col] === 1) {
    return {
      success: false,
      message: "Seat already occupied.",
      updatedSala: sala,
    };
  }

  const updatedSala = sala.map((currentRow, rowIndex) =>
    currentRow.map((seat, colIndex) => {
      if (rowIndex === row && colIndex === col) {
        return 1 as SeatState;
      }
      return seat;
    }),
  );

  return {
    success: true,
    message: "Seat booked successfully.",
    updatedSala,
  };
}

/**
 * Calculates seat statistics using iterative methods.
 */
function getStatistics(sala: CinemaSala): SalaStatistics {
  const occupied = sala.reduce((occupiedAcc, row) => {
    const occupiedInRow = row.reduce<number>(
      (rowAcc, seat) => rowAcc + (seat === 1 ? 1 : 0),
      0,
    );
    return occupiedAcc + occupiedInRow;
  }, 0);

  const total = sala.reduce((acc, row) => acc + row.length, 0);

  return {
    total,
    occupied,
    available: total - occupied,
  };
}

/**
 * Finds the first pair of horizontally contiguous available seats.
 */
function findContiguousSeats(sala: CinemaSala): ContiguousSeatsResult {
  for (let row = 0; row < sala.length; row += 1) {
    for (let col = 0; col < sala[row].length - 1; col += 1) {
      if (sala[row][col] === 0 && sala[row][col + 1] === 0) {
        return {
          found: true,
          seats: [
            { row, col },
            { row, col: col + 1 },
          ],
        };
      }
    }
  }

  return {
    found: false,
    seats: null,
  };
}

/**
 * Returns a new room with roughly 50% seats occupied at random.
 */
function markSalaAsSemiFull(sala: CinemaSala): CinemaSala {
  return sala.map((row) =>
    row.map((seat) => {
      if (Math.random() < 0.5) {
        return 1 as SeatState;
      }
      return seat;
    }),
  );
}

/**
 * Parses optional CLI booking args: "row col" or "row,col".
 */
function parseCliBookingArgs(args: string[]): CliBookingParseResult {
  if (args.length === 0) {
    return { seat: null, message: null };
  }

  const tokens =
    args.length === 1 && args[0].includes(",")
      ? args[0].split(",")
      : args.slice(0, 2);

  if (tokens.length < 2) {
    return {
      seat: null,
      message:
        "Formato invalido. Usa: npm run console -- <fila> <columna> o <fila,columna>",
    };
  }

  const row = Number.parseInt(tokens[0].trim(), 10);
  const col = Number.parseInt(tokens[1].trim(), 10);

  if (Number.isNaN(row) || Number.isNaN(col)) {
    return {
      seat: null,
      message:
        "Coordenadas invalidas. Fila y columna deben ser numeros enteros.",
    };
  }

  return {
    seat: { row, col },
    message: null,
  };
}

/**
 * Executes an automatic test suite for the cinema room logic.
 */
function runTestSuite(): void {
  console.log("=== Suite de Pruebas ===");

  console.log("\n1) Inicializacion de sala 8x10 semillena");
  let sala = initializeSala(8, 10);
  sala = markSalaAsSemiFull(sala);
  renderSala(sala);

  const cliBooking = parseCliBookingArgs(process.argv.slice(2));
  if (cliBooking.message) {
    console.log(`\nAviso: ${cliBooking.message}`);
  }

  const seatToBook: SeatCoordinates = cliBooking.seat ?? { row: 2, col: 3 };

  console.log(
    `\n2) Reserva intentada (fila ${seatToBook.row}, columna ${seatToBook.col})`,
  );
  const bookingSuccess = bookSeat(sala, seatToBook.row, seatToBook.col);
  console.log(bookingSuccess.message);
  sala = bookingSuccess.updatedSala;
  renderSala(sala);

  console.log(
    `\n3) Reserva fallida (mismas coordenadas: fila ${seatToBook.row}, columna ${seatToBook.col})`,
  );
  const bookingFailed = bookSeat(sala, seatToBook.row, seatToBook.col);
  console.log(bookingFailed.message);

  console.log("\n4) Busqueda de dos asientos contiguos libres");
  const contiguous = findContiguousSeats(sala);
  if (contiguous.found && contiguous.seats) {
    const [firstSeat, secondSeat] = contiguous.seats;
    console.log(
      `Primer par encontrado: (${firstSeat.row}, ${firstSeat.col}) y (${secondSeat.row}, ${secondSeat.col})`,
    );
  } else {
    console.log("No se encontraron asientos contiguos libres.");
  }

  console.log("\n5) Estadisticas finales");
  const statistics = getStatistics(sala);
  console.log(statistics);
}

runTestSuite();

export {
  initializeSala,
  renderSala,
  bookSeat,
  getStatistics,
  findContiguousSeats,
};