#include "ReconciliationEngine.hpp"

#include <cstdio>
#include <cstring>
#include <ctime>
#include <fstream>

namespace {
const int kMaxRows = 8192;
const int kLineBuf = 512;

void trimInPlace(char* s) {
    if (!s) {
        return;
    }
    int n = 0;
    while (s[n] != '\0') {
        ++n;
    }
    while (n > 0 && (s[n - 1] == ' ' || s[n - 1] == '\r' || s[n - 1] == '\n' || s[n - 1] == '\t')) {
        s[n - 1] = '\0';
        --n;
    }
    int start = 0;
    while (s[start] == ' ' || s[start] == '\t') {
        ++start;
    }
    if (start > 0) {
        int i = 0;
        while (s[start + i] != '\0') {
            s[i] = s[start + i];
            ++i;
        }
        s[i] = '\0';
    }
}

bool isHeaderLine(const char* line) {
    if (!line) {
        return false;
    }
    char lower[64];
    int i = 0;
    while (line[i] != '\0' && i < 63) {
        char c = line[i];
        if (c >= 'A' && c <= 'Z') {
            c = static_cast<char>(c - 'A' + 'a');
        }
        lower[i] = c;
        ++i;
    }
    lower[i] = '\0';
    return std::strstr(lower, "id") != nullptr && std::strstr(lower, "amount") != nullptr;
}

double parseDouble(const char* s) {
    if (!s) {
        return 0.0;
    }
    int i = 0;
    while (s[i] == ' ' || s[i] == '\t' || s[i] == '$' || s[i] == '"') {
        ++i;
    }
    int sign = 1;
    if (s[i] == '-') {
        sign = -1;
        ++i;
    } else if (s[i] == '+') {
        ++i;
    }
    double value = 0.0;
    while (s[i] >= '0' && s[i] <= '9') {
        value = value * 10.0 + (s[i] - '0');
        ++i;
    }
    if (s[i] == '.') {
        ++i;
        double place = 0.1;
        while (s[i] >= '0' && s[i] <= '9') {
            value += (s[i] - '0') * place;
            place *= 0.1;
            ++i;
        }
    }
    return sign * value;
}

}  // namespace

ReconciliationEngine::ReconciliationEngine() {
    glTable = new CustomHashTable(512);
    discrepancyHeap = new CustomMaxHeap(32);
    ledger = new CustomDoublyLinkedList();
    vendorTrie = new CustomTrie();
    amountIndex = new CustomAVLTree();
    stats.bankCount = 0;
    stats.glCount = 0;
    stats.matchedCount = 0;
    stats.unmatchedBankCount = 0;
    stats.unmatchedGlCount = 0;
    stats.totalBankVolume = 0.0;
    stats.matchedVolume = 0.0;
    stats.unmatchedBankVolume = 0.0;
    stats.unmatchedGlVolume = 0.0;
    stats.matchRate = 0.0;
    stats.processMs = 0;
}

ReconciliationEngine::~ReconciliationEngine() {
    delete glTable;
    delete discrepancyHeap;
    delete ledger;
    delete vendorTrie;
    delete amountIndex;
}

void ReconciliationEngine::reset() {
    glTable->clear();
    discrepancyHeap->clear();
    ledger->clear();
    vendorTrie->clear();
    amountIndex->clear();
    stats.bankCount = 0;
    stats.glCount = 0;
    stats.matchedCount = 0;
    stats.unmatchedBankCount = 0;
    stats.unmatchedGlCount = 0;
    stats.totalBankVolume = 0.0;
    stats.matchedVolume = 0.0;
    stats.unmatchedBankVolume = 0.0;
    stats.unmatchedGlVolume = 0.0;
    stats.matchRate = 0.0;
    stats.processMs = 0;
}

void ReconciliationEngine::skipBom(char* line) const {
    if (!line) {
        return;
    }
    unsigned char* u = reinterpret_cast<unsigned char*>(line);
    if (u[0] == 0xEF && u[1] == 0xBB && u[2] == 0xBF) {
        int i = 0;
        while (line[i + 3] != '\0') {
            line[i] = line[i + 3];
            ++i;
        }
        line[i] = '\0';
    }
}

bool ReconciliationEngine::parseLine(char* line, TransactionRecord& rec) const {
    initTransaction(rec);
    if (!line) {
        return false;
    }
    skipBom(line);
    trimInPlace(line);
    if (line[0] == '\0') {
        return false;
    }

    char fields[5][128];
    for (int f = 0; f < 5; ++f) {
        fields[f][0] = '\0';
    }
    int field = 0;
    int pos = 0;
    bool inQuotes = false;
    for (int i = 0; line[i] != '\0' && field < 5; ++i) {
        char c = line[i];
        if (c == '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (c == ',' && !inQuotes) {
            fields[field][pos] = '\0';
            ++field;
            pos = 0;
            continue;
        }
        if (pos < 127) {
            fields[field][pos++] = c;
        }
    }
    if (field < 5) {
        fields[field][pos] = '\0';
    }
    if (field < 3) {
        return false;
    }

    copyCStr(rec.id, fields[0], 32);
    copyCStr(rec.date, fields[1], 16);
    rec.amount = parseDouble(fields[2]);
    copyCStr(rec.memo, fields[3], 128);
    copyCStr(rec.status, "PENDING", 16);
    trimInPlace(rec.id);
    trimInPlace(rec.date);
    trimInPlace(rec.memo);
    return rec.id[0] != '\0';
}

bool ReconciliationEngine::ingestFile(const char* path, bool isBank) {
    std::ifstream in(path);
    if (!in) {
        return false;
    }
    TransactionRecord* rows = new TransactionRecord[kMaxRows];
    int count = 0;
    char line[kLineBuf];
    bool first = true;
    while (in.getline(line, kLineBuf)) {
        if (first) {
            skipBom(line);
            first = false;
            if (isHeaderLine(line)) {
                continue;
            }
        }
        TransactionRecord rec;
        if (!parseLine(line, rec)) {
            continue;
        }
        if (count < kMaxRows) {
            copyTransaction(rows[count], rec);
            ++count;
        }
    }
    in.close();

    if (isBank) {
        stats.bankCount = count;
        runMatchPass(rows, count);
    } else {
        stats.glCount = count;
        for (int i = 0; i < count; ++i) {
            copyCStr(rows[i].status, "GL", 16);
            glTable->insert(rows[i]);
        }
    }
    delete[] rows;
    return true;
}

bool ReconciliationEngine::ingestStringAsFile(const char* csvText, const char* virtualPath, bool isBank) {
    if (!csvText || !virtualPath) {
        return false;
    }
    std::ofstream out(virtualPath);
    if (!out) {
        return false;
    }
    out << csvText;
    out.close();
    return ingestFile(virtualPath, isBank);
}

void ReconciliationEngine::runMatchPass(TransactionRecord* bankRows, int bankCount) {
    stats.totalBankVolume = 0.0;
    stats.matchedVolume = 0.0;
    stats.unmatchedBankVolume = 0.0;
    stats.matchedCount = 0;
    stats.unmatchedBankCount = 0;

    for (int i = 0; i < bankCount; ++i) {
        TransactionRecord bankRec;
        copyTransaction(bankRec, bankRows[i]);
        double absAmt = bankRec.amount < 0.0 ? -bankRec.amount : bankRec.amount;
        stats.totalBankVolume += absAmt;
        vendorTrie->insert(bankRec.memo);

        TransactionRecord glRec;
        bool matched = glTable->findAndRemove(bankRec.id, bankRec.amount, glRec);
        if (matched) {
            copyCStr(bankRec.status, "MATCHED", 16);
            ledger->pushBack(bankRec);
            amountIndex->insert(bankRec);
            stats.matchedVolume += absAmt;
            ++stats.matchedCount;
        } else {
            copyCStr(bankRec.status, "UNMATCHED", 16);
            ledger->pushBack(bankRec);
            discrepancyHeap->push(bankRec);
            stats.unmatchedBankVolume += absAmt;
            ++stats.unmatchedBankCount;
        }
    }

    TransactionRecord leftover[kMaxRows];
    int leftoverCount = 0;
    glTable->drainRemaining(leftover, kMaxRows, leftoverCount);
    stats.unmatchedGlCount = leftoverCount;
    stats.unmatchedGlVolume = 0.0;
    for (int i = 0; i < leftoverCount; ++i) {
        copyCStr(leftover[i].status, "GL_ONLY", 16);
        discrepancyHeap->push(leftover[i]);
        double absAmt = leftover[i].amount < 0.0 ? -leftover[i].amount : leftover[i].amount;
        stats.unmatchedGlVolume += absAmt;
    }

    if (stats.bankCount > 0) {
        stats.matchRate = (100.0 * stats.matchedCount) / static_cast<double>(stats.bankCount);
    } else {
        stats.matchRate = 0.0;
    }
}

bool ReconciliationEngine::loadFromFiles(const char* bankPath, const char* glPath) {
    clock_t start = clock();
    reset();
    bool glOk = ingestFile(glPath, false);
    bool bankOk = ingestFile(bankPath, true);
    clock_t end = clock();
    stats.processMs = static_cast<long>(((end - start) * 1000.0) / CLOCKS_PER_SEC);
    return glOk && bankOk;
}

bool ReconciliationEngine::loadFromStrings(const char* bankCsv, const char* glCsv) {
    clock_t start = clock();
    reset();
    bool glOk = ingestStringAsFile(glCsv, "general_ledger.csv", false);
    bool bankOk = ingestStringAsFile(bankCsv, "bank_feed.csv", true);
    clock_t end = clock();
    stats.processMs = static_cast<long>(((end - start) * 1000.0) / CLOCKS_PER_SEC);
    if (stats.processMs < 1) {
        stats.processMs = 1;
    }
    return glOk && bankOk;
}

bool ReconciliationEngine::exportReport(const char* outPath) const {
    std::ofstream out(outPath);
    if (!out) {
        return false;
    }
    out << "id,date,amount,memo,status\n";
    TransactionRecord* rows = new TransactionRecord[kMaxRows];
    int written = 0;
    ledger->snapshot(rows, kMaxRows, written);
    for (int i = 0; i < written; ++i) {
        out << rows[i].id << "," << rows[i].date << "," << rows[i].amount << ","
            << rows[i].memo << "," << rows[i].status << "\n";
    }
    TransactionRecord disc[kMaxRows];
    int dcount = 0;
    discrepancyHeap->snapshotTop(disc, kMaxRows, dcount);
    for (int i = 0; i < dcount; ++i) {
        if (cStrEquals(disc[i].status, "GL_ONLY")) {
            out << disc[i].id << "," << disc[i].date << "," << disc[i].amount << ","
                << disc[i].memo << "," << disc[i].status << "\n";
        }
    }
    out << "\nSUMMARY,matched_count," << stats.matchedCount
        << ",unmatched_bank," << stats.unmatchedBankCount
        << ",unmatched_gl," << stats.unmatchedGlCount
        << ",match_rate," << stats.matchRate
        << ",unmatched_bank_volume," << stats.unmatchedBankVolume
        << ",unmatched_gl_volume," << stats.unmatchedGlVolume << "\n";
    delete[] rows;
    return true;
}

char* ReconciliationEngine::duplicateCStr(const char* src) const {
    int n = cStrLength(src);
    char* out = new char[n + 1];
    copyCStr(out, src ? src : "", n + 1);
    return out;
}

char* ReconciliationEngine::exportReportToString() const {
    const int cap = 256 * 1024;
    char* buf = new char[cap];
    int len = 0;
    const char* header = "id,date,amount,memo,status\n";
    for (int i = 0; header[i] != '\0' && len < cap - 1; ++i) {
        buf[len++] = header[i];
    }
    TransactionRecord* rows = new TransactionRecord[kMaxRows];
    int written = 0;
    ledger->snapshot(rows, kMaxRows, written);
    for (int i = 0; i < written && len < cap - 200; ++i) {
        len += std::snprintf(buf + len, cap - len, "%s,%s,%.2f,%s,%s\n",
                             rows[i].id, rows[i].date, rows[i].amount, rows[i].memo, rows[i].status);
    }
    TransactionRecord disc[512];
    int dcount = 0;
    discrepancyHeap->snapshotTop(disc, 512, dcount);
    for (int i = 0; i < dcount && len < cap - 200; ++i) {
        if (cStrEquals(disc[i].status, "GL_ONLY")) {
            len += std::snprintf(buf + len, cap - len, "%s,%s,%.2f,%s,%s\n",
                                 disc[i].id, disc[i].date, disc[i].amount, disc[i].memo, disc[i].status);
        }
    }
    if (len < cap - 200) {
        len += std::snprintf(buf + len, cap - len,
                             "\nSUMMARY,matched_count,%d,unmatched_bank,%d,unmatched_gl,%d,match_rate,%.2f,unmatched_bank_volume,%.2f,unmatched_gl_volume,%.2f\n",
                             stats.matchedCount, stats.unmatchedBankCount, stats.unmatchedGlCount,
                             stats.matchRate, stats.unmatchedBankVolume, stats.unmatchedGlVolume);
    }
    buf[len] = '\0';
    delete[] rows;
    return buf;
}

SummaryStats ReconciliationEngine::getStats() const {
    return stats;
}

int ReconciliationEngine::getTopDiscrepancies(TransactionRecord* out, int maxOut) const {
    int written = 0;
    discrepancyHeap->snapshotTop(out, maxOut, written);
    return written;
}

int ReconciliationEngine::searchMemos(const char* prefix, char results[][128], int maxResults) const {
    return vendorTrie->searchPrefix(prefix, results, maxResults);
}

int ReconciliationEngine::queryRange(double minAmount, double maxAmount, TransactionRecord* out, int maxOut) const {
    return amountIndex->rangeQuery(minAmount, maxAmount, out, maxOut);
}

int ReconciliationEngine::getLedgerSnapshot(TransactionRecord* out, int maxOut) const {
    int written = 0;
    ledger->snapshot(out, maxOut, written);
    return written;
}
