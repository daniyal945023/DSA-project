#ifndef RECONCILIATION_ENGINE_HPP
#define RECONCILIATION_ENGINE_HPP

#include "CustomAVLTree.hpp"
#include "CustomDoublyLinkedList.hpp"
#include "CustomHashTable.hpp"
#include "CustomMaxHeap.hpp"
#include "CustomTrie.hpp"
#include "TransactionRecord.hpp"

struct SummaryStats {
    int bankCount;
    int glCount;
    int matchedCount;
    int unmatchedBankCount;
    int unmatchedGlCount;
    double totalBankVolume;
    double matchedVolume;
    double unmatchedBankVolume;
    double unmatchedGlVolume;
    double matchRate;
    long processMs;
};

class ReconciliationEngine {
public:
    ReconciliationEngine();
    ~ReconciliationEngine();

    ReconciliationEngine(const ReconciliationEngine&) = delete;
    ReconciliationEngine& operator=(const ReconciliationEngine&) = delete;

    bool loadFromFiles(const char* bankPath, const char* glPath);
    bool loadFromStrings(const char* bankCsv, const char* glCsv);
    bool exportReport(const char* outPath) const;
    char* exportReportToString() const;

    SummaryStats getStats() const;
    int getTopDiscrepancies(TransactionRecord* out, int maxOut) const;
    int searchMemos(const char* prefix, char results[][128], int maxResults) const;
    int queryRange(double minAmount, double maxAmount, TransactionRecord* out, int maxOut) const;
    int getLedgerSnapshot(TransactionRecord* out, int maxOut) const;
    void reset();

private:
    CustomHashTable* glTable;
    CustomMaxHeap* discrepancyHeap;
    CustomDoublyLinkedList* ledger;
    CustomTrie* vendorTrie;
    CustomAVLTree* amountIndex;

    SummaryStats stats;

    bool ingestFile(const char* path, bool isBank);
    bool ingestStringAsFile(const char* csvText, const char* virtualPath, bool isBank);
    bool parseLine(char* line, TransactionRecord& rec) const;
    void skipBom(char* line) const;
    void runMatchPass(TransactionRecord* bankRows, int bankCount);
    char* duplicateCStr(const char* src) const;
};

#endif
