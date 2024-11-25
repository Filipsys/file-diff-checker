// import type { LocalContext } from "./context";
//
// interface Flags {
//     readonly dirInput?: String;
//     readonly fileInput?: String;
// }
//
// export default async function(this: LocalContext, { dirInput, fileInput }: Flags): Promise<void> {
//     if (dirInput === undefined && fileInput === undefined) {
//         this.process.stdout.write("Directory input not provided.\n");
//         return;
//     }
//
//     this.process.stdout.write(`Hello!\nDirectory input: ${dirInput}\n`);
// }
//
// // export function alt(flags: {}) {
// //     console.log("This is the alternative function");
// // }