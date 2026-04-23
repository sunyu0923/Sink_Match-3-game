/**
 * 极简测试运行器（无外部依赖）
 */
type TestFn = () => void | Promise<void>;
const tests: { name: string; fn: TestFn }[] = [];
let currentFile = '';

export function describe(file: string, body: () => void): void {
    currentFile = file;
    body();
}

export function it(name: string, fn: TestFn): void {
    tests.push({ name: `[${currentFile}] ${name}`, fn });
}

export function assertEq(actual: any, expected: any, msg = ''): void {
    const a = JSON.stringify(actual);
    const e = JSON.stringify(expected);
    if (a !== e) throw new Error(`${msg}\n  expected: ${e}\n  actual:   ${a}`);
}

export function assertTrue(cond: boolean, msg = ''): void {
    if (!cond) throw new Error(msg || 'expected true');
}

export async function runAll(): Promise<void> {
    let pass = 0, fail = 0;
    for (const t of tests) {
        try {
            await t.fn();
            console.log(`\x1b[32m✓\x1b[0m ${t.name}`);
            pass++;
        } catch (e: any) {
            console.log(`\x1b[31m✗\x1b[0m ${t.name}`);
            console.log('  ' + (e.stack || e.message).split('\n').join('\n  '));
            fail++;
        }
    }
    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail > 0) process.exit(1);
}
