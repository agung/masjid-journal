import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import { formatRupiah, formatDate, formatMonthYear } from '@/lib/formatters'

const COLORS = {
  primary: '#166534',     // green-800
  primaryLight: '#dcfce7', // green-100
  heading: '#111827',     // gray-900
  subtext: '#6b7280',     // gray-500
  border: '#e5e7eb',      // gray-200
  rowAlt: '#f9fafb',      // gray-50
  green: '#16a34a',       // green-600
  red: '#dc2626',         // red-600
  white: '#ffffff',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: COLORS.heading,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
  },
  // ── header ────────────────────────────────────────────────────
  header: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  orgName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  periodLabel: {
    fontSize: 10,
    color: COLORS.subtext,
  },
  // ── account summary ───────────────────────────────────────────
  summarySection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.subtext,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 8,
    backgroundColor: COLORS.rowAlt,
  },
  summaryCardLabel: {
    fontSize: 7.5,
    color: COLORS.subtext,
    marginBottom: 3,
  },
  summaryCardTotal: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  accountLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  accountLineName: {
    fontSize: 7.5,
    color: COLORS.subtext,
    flex: 1,
  },
  accountLineBalance: {
    fontSize: 7.5,
    color: COLORS.heading,
  },
  // ── movement table ────────────────────────────────────────────
  tableSection: {
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginBottom: 1,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.white,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.rowAlt,
  },
  tableCell: {
    fontSize: 8,
    color: COLORS.heading,
  },
  tableCellSub: {
    fontSize: 7,
    color: COLORS.subtext,
    marginTop: 1,
  },
  cellIn: {
    fontSize: 8,
    color: COLORS.green,
  },
  cellOut: {
    fontSize: 8,
    color: COLORS.red,
  },
  // column widths
  colNo: { width: 22 },
  colDate: { width: 52 },
  colDesc: { flex: 1 },
  colAccount: { width: 70 },
  colIn: { width: 72, textAlign: 'right' },
  colOut: { width: 72, textAlign: 'right' },
  colBalance: { width: 76, textAlign: 'right' },
  // ── empty state ───────────────────────────────────────────────
  emptyBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 9,
    color: COLORS.subtext,
  },
  // ── footer ────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: COLORS.subtext,
  },
})

// ── types ────────────────────────────────────────────────────────────────────

interface AccountItem {
  id: string
  name: string
  currentBalance: number
  kind: string | null
}

interface MovementRow {
  movementId: string
  direction: string | null
  amount: number | null
  balanceAfter: number | null
  accountName: string
  accountKind: string | null
  transactionDate: string
  transactionNo: string
  description: string | null
}

interface AccountSummary {
  cashHolders: AccountItem[]
  banks: AccountItem[]
  totalCash: number
  totalBank: number
}

interface TransactionReportPdfProps {
  orgName: string
  year: number
  month: number
  accountSummary: AccountSummary
  movements: MovementRow[]
  generatedAt: string
}

// ── component ────────────────────────────────────────────────────────────────

export function TransactionReportPdf({
  orgName,
  year,
  month,
  accountSummary,
  movements,
  generatedAt,
}: TransactionReportPdfProps) {
  const periodLabel = formatMonthYear(new Date(year, month - 1))

  return (
    <Document
      title={`Laporan Transaksi ${periodLabel} — ${orgName}`}
      author={orgName}
    >
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.orgName}>{orgName}</Text>
          <Text style={styles.periodLabel}>Laporan Keuangan — {periodLabel}</Text>
        </View>

        {/* ── Account Summary ── */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Ringkasan Saldo</Text>
          <View style={styles.summaryGrid}>
            {/* Bank card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Saldo Bank</Text>
              <Text style={styles.summaryCardTotal}>
                {formatRupiah(accountSummary.totalBank)}
              </Text>
              {accountSummary.banks.map((acc) => (
                <View key={acc.id} style={styles.accountLine}>
                  <Text style={styles.accountLineName}>{acc.name}</Text>
                  <Text style={styles.accountLineBalance}>
                    {formatRupiah(Number(acc.currentBalance))}
                  </Text>
                </View>
              ))}
              {accountSummary.banks.length === 0 && (
                <Text style={styles.tableCellSub}>—</Text>
              )}
            </View>

            {/* Cash card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardLabel}>Saldo On-Hand (Kas)</Text>
              <Text style={styles.summaryCardTotal}>
                {formatRupiah(accountSummary.totalCash)}
              </Text>
              {accountSummary.cashHolders.map((acc) => (
                <View key={acc.id} style={styles.accountLine}>
                  <Text style={styles.accountLineName}>{acc.name}</Text>
                  <Text style={styles.accountLineBalance}>
                    {formatRupiah(Number(acc.currentBalance))}
                  </Text>
                </View>
              ))}
              {accountSummary.cashHolders.length === 0 && (
                <Text style={styles.tableCellSub}>—</Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Movement Table ── */}
        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>
            Rincian Transaksi ({movements.length})
          </Text>

          {movements.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Tidak ada transaksi pada periode ini.
              </Text>
            </View>
          ) : (
            <View>
              {/* Table header row */}
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>Tanggal</Text>
                <Text style={[styles.tableHeaderCell, styles.colDesc]}>Keterangan</Text>
                <Text style={[styles.tableHeaderCell, styles.colAccount]}>Akun</Text>
                <Text style={[styles.tableHeaderCell, styles.colIn]}>Masuk</Text>
                <Text style={[styles.tableHeaderCell, styles.colOut]}>Keluar</Text>
                <Text style={[styles.tableHeaderCell, styles.colBalance]}>Saldo Akhir</Text>
              </View>

              {/* Data rows */}
              {movements.map((m, i) => (
                <View
                  key={m.movementId}
                  style={[
                    styles.tableRow,
                    i % 2 !== 0 ? styles.tableRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.tableCell, styles.colNo]}>{i + 1}</Text>
                  <Text style={[styles.tableCell, styles.colDate]}>
                    {formatDate(m.transactionDate)}
                  </Text>
                  <View style={styles.colDesc}>
                    <Text style={styles.tableCell}>
                      {m.description ?? '—'}
                    </Text>
                    <Text style={styles.tableCellSub}>{m.transactionNo}</Text>
                  </View>
                  <Text style={[styles.tableCell, styles.colAccount]}>
                    {m.accountName}
                  </Text>
                  <Text style={[styles.cellIn, styles.colIn]}>
                    {m.direction === 'in'
                      ? formatRupiah(Number(m.amount ?? 0))
                      : ''}
                  </Text>
                  <Text style={[styles.cellOut, styles.colOut]}>
                    {m.direction === 'out'
                      ? formatRupiah(Number(m.amount ?? 0))
                      : ''}
                  </Text>
                  <Text style={[styles.tableCell, styles.colBalance]}>
                    {formatRupiah(Number(m.balanceAfter ?? 0))}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Dicetak: {generatedAt}</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
