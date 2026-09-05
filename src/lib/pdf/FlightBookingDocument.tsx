// src/lib/pdf/FlightBookingDocument.tsx
//
// Mirrors HotelBookingDocument exactly — same header rules, divider, info
// cards, notes/summary split, payment history, footer.
//
// Voucher = client-facing. Zero pricing, zero bank details. Shows the PNR
//   and passenger list (what the traveller actually needs at check-in),
//   plus Makkah/Madinah/Hotline and the agency verification QR.
// Invoice = internal. Per-pax selling rates only — never buying cost or
//   profit.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import {
  calculateFlightSegmentTotals,
  sumLineItems,
  calculateFooterTotals,
  sumPayments,
  calculateRemainingBalance,
} from "@/src/lib/pricingCalculations";

type SegmentRow = {
  airline: string;
  flightNo: string;
  pnr: string | null;
  departureAirport: string;
  arrivalAirport: string;
  departureDateTime: string | Date;
  arrivalDateTime: string | Date;
  travelClass: string | null;
  adults: number;
  children: number;
  infants: number;
  baggage: string | null;
  passengerNames: string | null;
  adultBuyingPricePerLeg: number;
  adultSellingPricePerLeg: number;
  childBuyingPricePerLeg: number;
  childSellingPricePerLeg: number;
  infantBuyingPricePerLeg: number;
  infantSellingPricePerLeg: number;
};

type PaymentEntry = {
  amount: number;
  paidOn: string | Date;
  note: string | null;
  bankAccount: { accountName: string | null; bankName: string | null } | null;
};

type BookingData = {
  id: string;
  agentName: string;
  guestName: string;
  nationality: string;
  mobileNo: string;
  referenceNo: string | null;
  currency: string;
  discount: number;
  vatPercent: number;
  paymentType: string | null;
  paymentStatus: string | null;
  note: string | null;
  vendorName: string | null;
  createdAt: string | Date;
  segments: SegmentRow[];
  payments: PaymentEntry[];
};

type AgencyData = {
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  bankAccounts: {
    accountName: string | null;
    bankName: string | null;
    accountNo: string | null;
    iban: string | null;
    address: string | null;
  }[];
  cancellationPolicy: string | null;
  noShowPolicy: string | null;
  makkahContact: string | null;
  madinahContact: string | null;
  hotlineContact: string | null;
  address: string | null;
  branches: string | null;
  licenseNo: string | null;
};

function fmtDate(d: string | Date) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  return `${datePart} (${weekday})`;
}
// Day-of-week matters as much as the date for flights — it goes back in,
// with the time on a second line so the column doesn't get too wide.
function fmtDateTime(d: string | Date) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const timePart = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} (${weekday})\n${timePart}`;
}
function money(n: number, currency: string) {
  return `${currency} ${n.toFixed(2)}`;
}

export function FlightBookingDocument({
  booking,
  agency,
  variant,
  verifyQrDataUri,
}: {
  booking: BookingData;
  agency: AgencyData;
  variant: "invoice" | "voucher";
  verifyQrDataUri?: string | null;
}) {
  const isInvoice = variant === "invoice";
  const accent = agency.primaryColor || "#D2232A";

  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#121212" },

    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
    logoRow: { flexDirection: "column" },
    logoBig: { width: 155, height: 88, objectFit: "contain" },
    agencyNameFallback: { fontSize: 19, fontFamily: "Helvetica-Bold" },
    branchesText: { fontSize: 6.5, color: "#9A9A9A", marginTop: 4, maxWidth: 220 },
    docTitleBlock: { alignItems: "flex-end" },
    docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, color: accent },
    badgeRow: { flexDirection: "row", gap: 6, marginTop: 8 },
    badge: { backgroundColor: accent, color: "white", paddingVertical: 5, paddingHorizontal: 9, borderRadius: 3, fontSize: 8 },
    licenseText: { fontSize: 6.5, color: "#9A9A9A", marginTop: 4 },

    dotDivider: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: 14, gap: 6 },
    dotLine: { flex: 1, height: 1, backgroundColor: "#E0E0E0" },
    dotMark: { fontSize: 9, color: accent },

    sectionRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    infoCard: { flex: 1, border: "1pt solid #E5E1D8", borderRadius: 6, overflow: "hidden" },
    infoCardTitleBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10 },
    infoCardTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.5 },
    infoCardBody: { padding: 10 },
    infoLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    infoLabel: { color: "#6B6B6B" },
    infoValue: { fontFamily: "Helvetica-Bold" },

    entryTitleBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginBottom: 0, marginTop: 6 },
    entryTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.8 },
    table: { border: "1pt solid #E5E1D8", borderTop: "none", marginBottom: 0 },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#F3F1EC" },
    tableRow: { flexDirection: "row", borderTop: "1pt solid #EFEDE7" },
    th: { padding: 6, color: "#5A5A5A", fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase" },
    td: { padding: 6, fontSize: 8 },

    paxBox: { border: "1pt solid #E5E1D8", borderTop: "none", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, padding: 8, marginBottom: 16, backgroundColor: "#FAF9F6" },
    paxLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#5A5A5A", textTransform: "uppercase", marginBottom: 3 },
    paxName: { fontSize: 8, color: "#121212", marginBottom: 1.5 },
    tableBottomRadius: { borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginBottom: 16 },

    priceRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginBottom: 16 },
    notesBox: { flex: 1, border: "1pt solid #E5E1D8", borderRadius: 6, padding: 12 },
    notesTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: accent, textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 },
    notesText: { fontSize: 8, color: "#6B6B6B", marginBottom: 3, lineHeight: 1.4 },

    summaryBox: { width: 230, border: "1pt solid #E5E1D8", borderRadius: 6, padding: 12 },
    summaryLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    summaryTotalLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1pt solid #E5E1D8" },
    summaryTotalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
    summaryTotalValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: accent },

    paymentHistoryBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginTop: 6 },
    paymentHistoryTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.8 },
    paymentTable: { border: "1pt solid #E5E1D8", borderTop: "none", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginBottom: 16 },

    footer: { marginTop: 8, paddingTop: 12, borderTop: "1pt solid #E5E1D8" },
    footerRow: { flexDirection: "row", gap: 24, alignItems: "flex-start" },
    footerCol: { flex: 1 },
    footerTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: accent, textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 },
    footerText: { fontSize: 7.5, color: "#6B6B6B", marginBottom: 2 },
    policyText: { fontSize: 7, color: "#9A9A9A", marginTop: 2 },
    signOff: { marginTop: 14, alignItems: "flex-end" },
    signOffText: { fontSize: 8, color: "#6B6B6B" },

    qrBlock: { alignItems: "center" },
    qrImage: { width: 70, height: 70 },
    qrCaption: { fontSize: 6.5, color: "#9A9A9A", marginTop: 3, textAlign: "center" },
  });

  const rowTotals = booking.segments.map((s) => calculateFlightSegmentTotals(s));
  const { grossBuying, grossSelling } = sumLineItems(
    rowTotals.map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal }))
  );
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: booking.discount,
    vatPercent: booking.vatPercent,
  });

  const totalPaid = sumPayments(booking.payments || []);
  const remainingBalance = calculateRemainingBalance(totals.netTotal, booking.payments || []);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          {/* Big logo only when one exists — never logo + name together. */}
          <View style={styles.logoRow}>
            {agency.logoUrl ? (
              <Image src={agency.logoUrl} style={styles.logoBig} />
            ) : (
              <Text style={styles.agencyNameFallback}>{agency.name}</Text>
            )}
            {agency.branches && (
              <Text style={styles.branchesText}>{agency.branches.split("\n").filter(Boolean).join("  •  ")}</Text>
            )}
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>{isInvoice ? "INVOICE" : "VOUCHER"}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>REF {booking.referenceNo || booking.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.badge}>{fmtDate(booking.createdAt)}</Text>
            </View>
            {agency.licenseNo && <Text style={styles.licenseText}>License No: {agency.licenseNo}</Text>}
          </View>
        </View>

        <View style={styles.dotDivider}>
          <View style={styles.dotLine} />
          <Text style={styles.dotMark}>✕</Text>
          <View style={styles.dotLine} />
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.infoCard}>
            <View style={styles.infoCardTitleBar}>
              <Text style={styles.infoCardTitle}>Booking Information</Text>
            </View>
            <View style={styles.infoCardBody}>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Agent</Text><Text style={styles.infoValue}>{booking.agentName}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Reference No.</Text><Text style={styles.infoValue}>{booking.referenceNo || "—"}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Currency</Text><Text style={styles.infoValue}>{booking.currency}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Payment Status</Text><Text style={styles.infoValue}>{booking.paymentStatus || "Pending"}</Text></View>
              {isInvoice && (
                <View style={styles.infoLine}><Text style={styles.infoLabel}>Payment Type</Text><Text style={styles.infoValue}>{booking.paymentType || "—"}</Text></View>
              )}
              {isInvoice && booking.vendorName && (
                <View style={styles.infoLine}><Text style={styles.infoLabel}>Vendor</Text><Text style={styles.infoValue}>{booking.vendorName}</Text></View>
              )}
            </View>
          </View>
          <View style={styles.infoCard}>
            <View style={styles.infoCardTitleBar}>
              <Text style={styles.infoCardTitle}>Guest Information</Text>
            </View>
            <View style={styles.infoCardBody}>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Guest Name</Text><Text style={styles.infoValue}>{booking.guestName}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Nationality</Text><Text style={styles.infoValue}>{booking.nationality}</Text></View>
              <View style={styles.infoLine}><Text style={styles.infoLabel}>Mobile No.</Text><Text style={styles.infoValue}>{booking.mobileNo}</Text></View>
            </View>
          </View>
        </View>

        {/* One block per leg, in entry order — same as Hotel's "Hotel 1". */}
        {booking.segments.map((s, i) => {
          const names = (s.passengerNames || "").split("\n").map((n) => n.trim()).filter(Boolean);
          return (
            <View key={i} wrap={false}>
              <View style={styles.entryTitleBar}>
                <Text style={styles.entryTitle}>
                  Flight {i + 1} — {s.departureAirport} to {s.arrivalAirport}
                </Text>
              </View>
              <View style={[styles.table, names.length === 0 ? styles.tableBottomRadius : {}]}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.th, { flex: 1.4 }]}>Airline</Text>
                  <Text style={[styles.th, { flex: 0.9 }]}>Flight No.</Text>
                  <Text style={[styles.th, { flex: 0.9 }]}>PNR</Text>
                  <Text style={[styles.th, { flex: 1.6 }]}>Departure</Text>
                  <Text style={[styles.th, { flex: 1.6 }]}>Arrival</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Class</Text>
                  <Text style={[styles.th, { flex: 0.9 }]}>Pax</Text>
                  {isInvoice ? (
                    <>
                      <Text style={[styles.th, { flex: 1.6 }]}>Rate / Pax</Text>
                      <Text style={[styles.th, { flex: 1 }]}>Sell Total</Text>
                    </>
                  ) : (
                    <Text style={[styles.th, { flex: 1 }]}>Baggage</Text>
                  )}
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.4 }]}>{s.airline}</Text>
                  <Text style={[styles.td, { flex: 0.9 }]}>{s.flightNo}</Text>
                  <Text style={[styles.td, { flex: 0.9 }]}>{s.pnr || "—"}</Text>
                  <Text style={[styles.td, { flex: 1.6 }]}>{fmtDateTime(s.departureDateTime)}</Text>
                  <Text style={[styles.td, { flex: 1.6 }]}>{fmtDateTime(s.arrivalDateTime)}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{s.travelClass || "—"}</Text>
                  <Text style={[styles.td, { flex: 0.9 }]}>
                    {s.adults}A{s.children ? ` ${s.children}C` : ""}{s.infants ? ` ${s.infants}I` : ""}
                  </Text>
                  {isInvoice ? (
                    <>
                      {/* Selling only — buying cost and profit never appear
                          on either document. */}
                      <Text style={[styles.td, { flex: 1.6 }]}>
                        A: {money(s.adultSellingPricePerLeg, booking.currency)}
                        {s.children > 0 ? ` / C: ${money(s.childSellingPricePerLeg, booking.currency)}` : ""}
                        {s.infants > 0 ? ` / I: ${money(s.infantSellingPricePerLeg, booking.currency)}` : ""}
                      </Text>
                      <Text style={[styles.td, { flex: 1 }]}>{money(rowTotals[i].sellingTotal, booking.currency)}</Text>
                    </>
                  ) : (
                    <Text style={[styles.td, { flex: 1 }]}>{s.baggage || "—"}</Text>
                  )}
                </View>
              </View>
              {names.length > 0 && (
                <View style={styles.paxBox}>
                  <Text style={styles.paxLabel}>Passengers</Text>
                  {names.map((n, ni) => (
                    <Text key={ni} style={styles.paxName}>{ni + 1}. {n}</Text>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {isInvoice && (
          <View style={styles.priceRow}>
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>Notes</Text>
              <Text style={styles.notesText}>{booking.note || "—"}</Text>
            </View>

            <View style={styles.summaryBox}>
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>Subtotal</Text><Text>{money(grossSelling, booking.currency)}</Text></View>
              {booking.discount > 0 && (
                <View style={styles.summaryLine}><Text style={styles.infoLabel}>Discount</Text><Text>-{money(booking.discount, booking.currency)}</Text></View>
              )}
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>VAT ({booking.vatPercent || 0}%)</Text><Text>{money(totals.taxAmount, booking.currency)}</Text></View>
              <View style={styles.summaryTotalLine}>
                <Text style={styles.summaryTotalLabel}>TOTAL PRICE</Text>
                <Text style={styles.summaryTotalValue}>{money(totals.netTotal, booking.currency)}</Text>
              </View>
              <View style={styles.summaryLine}><Text style={styles.infoLabel}>Total Paid</Text><Text>{money(totalPaid, booking.currency)}</Text></View>
              <View style={styles.summaryTotalLine}>
                <Text style={styles.summaryTotalLabel}>REMAINING BALANCE</Text>
                <Text style={styles.summaryTotalValue}>{money(remainingBalance, booking.currency)}</Text>
              </View>
            </View>
          </View>
        )}

        {isInvoice && booking.payments && booking.payments.length > 0 && (
          <View wrap={false}>
            <View style={styles.paymentHistoryBar}>
              <Text style={styles.paymentHistoryTitle}>Payment History</Text>
            </View>
            <View style={styles.paymentTable}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.2 }]}>Date</Text>
                <Text style={[styles.th, { flex: 1 }]}>Amount</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Method / Account</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Note</Text>
              </View>
              {booking.payments.map((p, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.2 }]}>{fmtDate(p.paidOn)}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{money(p.amount, booking.currency)}</Text>
                  <Text style={[styles.td, { flex: 1.6 }]}>
                    {p.bankAccount ? `${p.bankAccount.bankName || p.bankAccount.accountName} (Bank Transfer)` : "Cash"}
                  </Text>
                  <Text style={[styles.td, { flex: 1.6 }]}>{p.note || "—"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          {isInvoice ? (
            <View style={styles.footerRow}>
              <View style={styles.footerCol}>
                <Text style={styles.footerTitle}>Bank Details</Text>
                {agency.bankAccounts.length === 0 && <Text style={styles.footerText}>—</Text>}
                {agency.bankAccounts.map((acc, i) => (
                  <View key={i} style={{ marginBottom: i < agency.bankAccounts.length - 1 ? 6 : 0 }}>
                    {agency.bankAccounts.length > 1 && (
                      <Text style={[styles.footerText, { fontFamily: "Helvetica-Bold" }]}>Account {i + 1}</Text>
                    )}
                    {acc.accountName && <Text style={styles.footerText}>Account Name: {acc.accountName}</Text>}
                    {acc.bankName && <Text style={styles.footerText}>Bank: {acc.bankName}</Text>}
                    {acc.accountNo && <Text style={styles.footerText}>Account No: {acc.accountNo}</Text>}
                    {acc.iban && <Text style={styles.footerText}>IBAN: {acc.iban}</Text>}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.footerRow}>
              <View style={styles.footerCol}>
                <Text style={styles.footerTitle}>Contact</Text>
                {agency.makkahContact && <Text style={styles.footerText}>Makkah: {agency.makkahContact}</Text>}
                {agency.madinahContact && <Text style={styles.footerText}>Madinah: {agency.madinahContact}</Text>}
                {agency.hotlineContact && <Text style={styles.footerText}>Hotline: {agency.hotlineContact}</Text>}
              </View>
              {verifyQrDataUri && (
                <View style={styles.qrBlock}>
                  <Image src={verifyQrDataUri} style={styles.qrImage} />
                  <Text style={styles.qrCaption}>Scan to Verify{"\n"}Hajj & Umrah Services</Text>
                </View>
              )}
            </View>
          )}

          {agency.cancellationPolicy && <Text style={styles.policyText}>Cancellation Policy: {agency.cancellationPolicy}</Text>}
          {agency.noShowPolicy && <Text style={styles.policyText}>No-Show Policy: {agency.noShowPolicy}</Text>}

          <View style={styles.signOff}>
            <Text style={styles.signOffText}>Dear {booking.guestName},</Text>
            <Text style={styles.signOffText}>Thank you for choosing us — we look forward to serving you.</Text>
          </View>

          {agency.address && (
            <Text style={[styles.policyText, { textAlign: "center", marginTop: 10 }]}>{agency.address}</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}