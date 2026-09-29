#include "CustomAVLTree.hpp"
#include "CustomDoublyLinkedList.hpp"
#include "CustomHashTable.hpp"
#include "CustomMaxHeap.hpp"
#include "CustomTrie.hpp"
#include "ReconciliationEngine.hpp"

#include <cstdio>
#include <fstream>

static int gFailures = 0;

static void expectTrue(bool cond, const char* name) {
    if (cond) {
        std::printf("  PASS  %s\n", name);
    } else {
        std::printf("  FAIL  %s\n", name);
        ++gFailures;
    }
}

static void testHashTable() {
    std::printf("\n[CustomHashTable]\n");
    CustomHashTable table(16);
    TransactionRecord a;
    initTransaction(a);
    copyCStr(a.id, "TXN-001", 32);
    copyCStr(a.date, "2026-01-03", 16);
    a.amount = 1250.50;
    copyCStr(a.memo, "ACME PAYROLL", 128);
    table.insert(a);

    TransactionRecord b;
    initTransaction(b);
    copyCStr(b.id, "TXN-002", 32);
    b.amount = 88.10;
    copyCStr(b.memo, "UBER TRIP", 128);
    table.insert(b);

    expectTrue(table.getSize() == 2, "size after two inserts");
    expectTrue(table.find("TXN-001") != nullptr, "find TXN-001");
    expectTrue(table.find("MISSING") == nullptr, "missing key returns null");

    TransactionRecord out;
    expectTrue(table.findAndRemove("TXN-001", 1250.50, out), "exact id+amount remove");
    expectTrue(amountsEqual(out.amount, 1250.50), "removed amount preserved");
    expectTrue(table.getSize() == 1, "size after consume");
    expectTrue(!table.findAndRemove("TXN-002", 1.00, out), "amount mismatch does not consume");
}

static void testMaxHeap() {
    std::printf("\n[CustomMaxHeap]\n");
    CustomMaxHeap heap(2);
    TransactionRecord x;
    initTransaction(x);
    copyCStr(x.id, "A", 32);
    x.amount = 100.0;
    heap.push(x);
    copyCStr(x.id, "B", 32);
    x.amount = 5000.0;
    heap.push(x);
    copyCStr(x.id, "C", 32);
    x.amount = -2500.0;
    heap.push(x);

    expectTrue(heap.getSize() == 3, "heap grew past initial capacity");
    TransactionRecord top;
    expectTrue(heap.pop(top), "pop max");
    expectTrue(cStrEquals(top.id, "B"), "largest absolute dollar first");
    heap.pop(top);
    expectTrue(cStrEquals(top.id, "C"), "next by abs value");
}

static void testDll() {
    std::printf("\n[CustomDoublyLinkedList]\n");
    CustomDoublyLinkedList list;
    TransactionRecord r;
    initTransaction(r);
    copyCStr(r.id, "1", 32);
    list.pushBack(r);
    copyCStr(r.id, "2", 32);
    list.pushBack(r);
    copyCStr(r.id, "0", 32);
    list.pushFront(r);
    expectTrue(list.getSize() == 3, "three nodes");
    expectTrue(list.getHead() && cStrEquals(list.getHead()->data.id, "0"), "head is front insert");
    expectTrue(list.getTail() && cStrEquals(list.getTail()->data.id, "2"), "tail is last back insert");
    expectTrue(list.getHead()->next->prev == list.getHead(), "prev/next linkage");
}

static void testTrie() {
    std::printf("\n[CustomTrie]\n");
    CustomTrie trie;
    trie.insert("ACME CORP PAYROLL");
    trie.insert("ACME CORP BENEFITS");
    trie.insert("UBER TRIP DOWNTOWN");
    expectTrue(trie.searchExact("ACME CORP PAYROLL"), "exact memo hit");
    expectTrue(!trie.searchExact("ACME"), "prefix is not exact");
    char results[8][128];
    int n = trie.searchPrefix("ACME", results, 8);
    expectTrue(n == 2, "prefix ACME returns two vendors");
    n = trie.searchPrefix("ZZZ", results, 8);
    expectTrue(n == 0, "unknown prefix empty");
}

static void testAvl() {
    std::printf("\n[CustomAVLTree]\n");
    CustomAVLTree tree;
    double amounts[] = {100.0, 2500.0, 4800.0, 50.0, 12000.0, 1000.0, 5000.0};
    for (int i = 0; i < 7; ++i) {
        TransactionRecord r;
        initTransaction(r);
        r.amount = amounts[i];
        r.id[0] = static_cast<char>('A' + i);
        r.id[1] = '\0';
        tree.insert(r);
    }
    expectTrue(tree.getSize() == 7, "seven inserts");
    TransactionRecord out[16];
    int n = tree.rangeQuery(1000.0, 5000.0, out, 16);
    expectTrue(n == 4, "range $1000-$5000 has four matched amounts");
    bool allInRange = true;
    for (int i = 0; i < n; ++i) {
        if (out[i].amount < 1000.0 || out[i].amount > 5000.0) {
            allInRange = false;
        }
    }
    expectTrue(allInRange, "range results stay inside bounds");
}

static bool writeSample(const char* path, const char* body) {
    std::ofstream out(path);
    if (!out) {
        return false;
    }
    out << body;
    return true;
}

static void testEngine() {
    std::printf("\n[ReconciliationEngine]\n");
    const char* gl =
        "id,date,amount,memo\n"
        "TXN-100,2026-03-01,1500.00,ACME CORP PAYROLL\n"
        "TXN-101,2026-03-02,88.40,UBER TRIP DOWNTOWN\n"
        "TXN-102,2026-03-03,4200.00,AWS INFRA MARCH\n"
        "TXN-199,2026-03-04,75.00,GL ONLY ENTRY\n";
    const char* bank =
        "id,date,amount,memo\n"
        "TXN-100,2026-03-01,1500.00,ACME CORP PAYROLL\n"
        "TXN-101,2026-03-02,88.40,UBER TRIP DOWNTOWN\n"
        "TXN-777,2026-03-05,9999.99,UNKNOWN WIRE FRAUD RISK\n"
        "TXN-102,2026-03-03,4100.00,AWS INFRA MARCH ADJ\n";

    expectTrue(writeSample("test_gl.csv", gl), "write GL fixture");
    expectTrue(writeSample("test_bank.csv", bank), "write bank fixture");

    ReconciliationEngine engine;
    expectTrue(engine.loadFromFiles("test_bank.csv", "test_gl.csv"), "load CSVs");
    SummaryStats s = engine.getStats();
    expectTrue(s.bankCount == 4, "four bank rows");
    expectTrue(s.glCount == 4, "four GL rows");
    expectTrue(s.matchedCount == 2, "two exact id+amount matches");
    expectTrue(s.unmatchedBankCount == 2, "two unmatched bank rows");
    expectTrue(s.unmatchedGlCount == 2, "two leftover GL rows");

    TransactionRecord disc[8];
    int dn = engine.getTopDiscrepancies(disc, 8);
    expectTrue(dn >= 1 && amountsEqual(disc[0].amount, 9999.99), "heap surfaces largest discrepancy");

    char memos[8][128];
    int mn = engine.searchMemos("ACME", memos, 8);
    expectTrue(mn >= 1, "trie vendor prefix");

    TransactionRecord ranged[8];
    int rn = engine.queryRange(1000.0, 5000.0, ranged, 8);
    expectTrue(rn >= 1, "AVL range on matched amounts");

    expectTrue(engine.exportReport("reconciliation_report.csv"), "export report file");
}

int main() {
    std::printf("Enterprise Reconciliation Engine — native structure tests\n");
    testHashTable();
    testMaxHeap();
    testDll();
    testTrie();
    testAvl();
    testEngine();
    std::printf("\n%s  (%d failure(s))\n", gFailures == 0 ? "ALL TESTS PASSED" : "TESTS FAILED", gFailures);
    return gFailures == 0 ? 0 : 1;
}
