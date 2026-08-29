// src/lib/pdf/PackageBookingDocument.tsx
//
// Combines whichever service sections the package actually includes
// (Hotels / Transport / Flights / Visas) into one document — each section
// only renders if it has entries.
//
// Voucher = client-facing. Per-row pricing hidden the same way each
//   standalone type hides it (Hotel: Conf. No. instead; Transport: nothing;
//   Flight: PNR kept; Visa: passport/processing/dates kept). One combined
//   summary box at the end shows the TOTAL SELLING PRICE across every
//   included service — never buying cost or profit.
// Invoice = internal/dealer-facing, full pricing everywhere + profit.

import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { calculateHotelEntryTotals, sumLineItems, calculateFooterTotals } from "@/src/lib/pricingCalculations";

type HotelEntry = {
  hotelName: string; city: string; roomType: string;
  checkIn: string | Date; checkOut: string | Date;
  rooms: number; adults: number; children: number; infants: number;
  mealPlan: string | null; confirmationNo: string | null;
  buyingCostPerNight: number; sellingPricePerNight: number;
};
type TransportEntry = {
  vehicle: string; sector: string; pickupDate: string | Date; pickupTime: string;
  qty: number; buyingCost: number; sellingPrice: number;
};
type FlightEntry = {
  airline: string; flightNo: string; pnr: string | null;
  departureAirport: string; arrivalAirport: string;
  departureDateTime: string | Date; arrivalDateTime: string | Date;
  travelClass: string | null; adults: number; children: number; infants: number;
  buyingCost: number; sellingPrice: number;
};
type VisaEntry = {
  visaCategory: string; applicantName: string; passportNumber: string;
  processingType: string | null;
  submissionDate: string | Date | null; expiryDate: string | Date | null;
  buyingCost: number; sellingPrice: number;
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
  hotels: HotelEntry[];
  transportSegments: TransportEntry[];
  flightSegments: FlightEntry[];
  visaEntries: VisaEntry[];
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
  importantContact: string | null;
};

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  const datePart = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  return `${datePart} (${weekday})`;
}
function fmtTime(d: string | Date) {
  return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}
function money(n: number, currency: string) {
  return `${currency} ${n.toFixed(2)}`;
}

export function PackageBookingDocument({
  booking,
  agency,
  variant,
}: {
  booking: BookingData;
  agency: AgencyData;
  variant: "invoice" | "voucher";
}) {
  const isInvoice = variant === "invoice";
  const accent = agency.primaryColor || "#D2232A";

  const styles = StyleSheet.create({
    page: { padding: 30, fontSize: 9, fontFamily: "Helvetica", color: "#121212" },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    logo: { width: 85, height: 38, objectFit: "contain" },
    agencyName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
    docTitleBlock: { alignItems: "flex-end" },
    docTitle: { fontSize: 22, fontFamily: "Helvetica-Bold", letterSpacing: 1.5, color: accent },
    badgeRow: { flexDirection: "row", gap: 6, marginTop: 8 },
    badge: { backgroundColor: accent, color: "white", paddingVertical: 5, paddingHorizontal: 9, borderRadius: 3, fontSize: 8 },
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
    sectionTitleBar: { backgroundColor: accent, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 4, marginBottom: 0, marginTop: 12 },
    sectionTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "white", textTransform: "uppercase", letterSpacing: 0.8 },
    table: { border: "1pt solid #E5E1D8", borderTop: "none", borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginBottom: 4 },
    tableHeaderRow: { flexDirection: "row", backgroundColor: "#F3F1EC" },
    tableRow: { flexDirection: "row", borderTop: "1pt solid #EFEDE7" },
    tableRowAlt: { flexDirection: "row", borderTop: "1pt solid #EFEDE7", backgroundColor: "#FAF9F6" },
    th: { padding: 6, color: "#5A5A5A", fontFamily: "Helvetica-Bold", fontSize: 7, textTransform: "uppercase" },
    td: { padding: 6, fontSize: 8 },
    summaryBox: { alignSelf: "flex-end", width: 230, border: "1pt solid #E5E1D8", borderRadius: 6, padding: 12, marginTop: 16, marginBottom: 16 },
    summaryLine: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
    summaryTotalLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1pt solid #E5E1D8" },
    summaryTotalLabel: { fontFamily: "Helvetica-Bold", fontSize: 11 },
    summaryTotalValue: { fontFamily: "Helvetica-Bold", fontSize: 11, color: accent },
    footer: { marginTop: 8, paddingTop: 12, borderTop: "1pt solid #E5E1D8" },
    footerRow: { flexDirection: "row", gap: 24 },
    footerCol: { flex: 1 },
    footerTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: accent, textTransform: "uppercase", marginBottom: 5, letterSpacing: 0.5 },
    footerText: { fontSize: 7.5, color: "#6B6B6B", marginBottom: 2 },
    policyText: { fontSize: 7, color: "#9A9A9A", marginTop: 2 },
    signOff: { marginTop: 14, alignItems: "flex-end" },
    signOffText: { fontSize: 8, color: "#6B6B6B" },
  });

  // Combine line items across every included service — same totals math
  // every other booking type uses (hotel math delegated to the exact same
  // calculateHotelEntryTotals function Hotel's own document uses, so nights
  // and per-room totals can never disagree between the two documents).
  const hotelRowTotals = booking.hotels.map((h) => calculateHotelEntryTotals(h));
  const combinedLineItems = [
    ...hotelRowTotals.map((t) => ({ buyingCost: t.buyingTotal, sellingPrice: t.sellingTotal })),
    ...booking.transportSegments.map((t) => ({ buyingCost: t.buyingCost, sellingPrice: t.sellingPrice })),
    ...booking.flightSegments.map((f) => ({ buyingCost: f.buyingCost, sellingPrice: f.sellingPrice })),
    ...booking.visaEntries.map((v) => ({ buyingCost: v.buyingCost, sellingPrice: v.sellingPrice })),
  ];
  const { grossBuying, grossSelling } = sumLineItems(combinedLineItems);
  const totals = calculateFooterTotals({
    grossBuying,
    grossSelling,
    discount: booking.discount,
    vatPercent: booking.vatPercent,
  });
  const subtotal = grossSelling - (booking.discount || 0);
  const vatAmount = totals.netTotal - subtotal;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoRow}>
            {agency.logoUrl && <Image src={agency.logoUrl} style={styles.logo} />}
            <Text style={styles.agencyName}>{agency.name}</Text>
          </View>
          <View style={styles.docTitleBlock}>
            <Text style={styles.docTitle}>{isInvoice ? "INVOICE" : "VOUCHER"}</Text>
            <View style={styles.badgeRow}>
              <Text style={styles.badge}>REF {booking.referenceNo || booking.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.badge}>{fmtDate(booking.createdAt)}</Text>
            </View>
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

        {/* ---- HOTELS (only if included) ---- */}
        {booking.hotels.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionTitleBar}><Text style={styles.sectionTitle}>Hotels</Text></View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.8 }]}>Hotel</Text>
                <Text style={[styles.th, { flex: 1 }]}>Room</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Check-in</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Check-out</Text>
                <Text style={[styles.th, { flex: 0.7 }]}>Rooms</Text>
                {isInvoice ? (
                  <>
                    <Text style={[styles.th, { flex: 1 }]}>Buy Total</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Sell Total</Text>
                  </>
                ) : (
                  <Text style={[styles.th, { flex: 1 }]}>Conf. No.</Text>
                )}
              </View>
              {booking.hotels.map((h, i) => {
                const t = hotelRowTotals[i];
                return (
                  <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                    <Text style={[styles.td, { flex: 1.8 }]}>{h.hotelName}, {h.city}</Text>
                    <Text style={[styles.td, { flex: 1 }]}>{h.roomType}</Text>
                    <Text style={[styles.td, { flex: 1.2 }]}>{fmtDate(h.checkIn)}</Text>
                    <Text style={[styles.td, { flex: 1.2 }]}>{fmtDate(h.checkOut)}</Text>
                    <Text style={[styles.td, { flex: 0.7 }]}>{h.rooms}</Text>
                    {isInvoice ? (
                      <>
                        <Text style={[styles.td, { flex: 1 }]}>{money(t.buyingTotal, booking.currency)}</Text>
                        <Text style={[styles.td, { flex: 1 }]}>{money(t.sellingTotal, booking.currency)}</Text>
                      </>
                    ) : (
                      <Text style={[styles.td, { flex: 1 }]}>{h.confirmationNo || "—"}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ---- TRANSPORT (only if included) ---- */}
        {booking.transportSegments.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionTitleBar}><Text style={styles.sectionTitle}>Transport Segments</Text></View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.2 }]}>Vehicle</Text>
                <Text style={[styles.th, { flex: 2 }]}>Sector</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>Date</Text>
                <Text style={[styles.th, { flex: 0.8 }]}>Time</Text>
                {isInvoice && (
                  <>
                    <Text style={[styles.th, { flex: 1 }]}>Buying</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Selling</Text>
                  </>
                )}
              </View>
              {booking.transportSegments.map((t, i) => (
                <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.2 }]}>{t.vehicle}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>{t.sector}</Text>
                  <Text style={[styles.td, { flex: 1.3 }]}>{fmtDate(t.pickupDate)}</Text>
                  <Text style={[styles.td, { flex: 0.8 }]}>{t.pickupTime}</Text>
                  {isInvoice && (
                    <>
                      <Text style={[styles.td, { flex: 1 }]}>{money(t.buyingCost, booking.currency)}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{money(t.sellingPrice, booking.currency)}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ---- FLIGHTS (only if included) ---- */}
        {booking.flightSegments.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionTitleBar}><Text style={styles.sectionTitle}>Flight Segments</Text></View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.4 }]}>Flight</Text>
                <Text style={[styles.th, { flex: 1.8 }]}>Route</Text>
                <Text style={[styles.th, { flex: 1.6 }]}>Departure</Text>
                <Text style={[styles.th, { flex: 1.1 }]}>PNR</Text>
                {isInvoice && (
                  <>
                    <Text style={[styles.th, { flex: 1 }]}>Buying</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Selling</Text>
                  </>
                )}
              </View>
              {booking.flightSegments.map((f, i) => (
                <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.4 }]}>{f.airline} {f.flightNo}</Text>
                  <Text style={[styles.td, { flex: 1.8 }]}>{f.departureAirport} → {f.arrivalAirport}</Text>
                  <Text style={[styles.td, { flex: 1.6 }]}>{fmtDate(f.departureDateTime)} {fmtTime(f.departureDateTime)}</Text>
                  <Text style={[styles.td, { flex: 1.1 }]}>{f.pnr || "—"}</Text>
                  {isInvoice && (
                    <>
                      <Text style={[styles.td, { flex: 1 }]}>{money(f.buyingCost, booking.currency)}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{money(f.sellingPrice, booking.currency)}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ---- VISAS (only if included) ---- */}
        {booking.visaEntries.length > 0 && (
          <View wrap={false}>
            <View style={styles.sectionTitleBar}><Text style={styles.sectionTitle}>Visa Applicants</Text></View>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.6 }]}>Applicant</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Category</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>Passport No.</Text>
                <Text style={[styles.th, { flex: 1.3 }]}>Expiry</Text>
                {isInvoice && (
                  <>
                    <Text style={[styles.th, { flex: 1 }]}>Buying</Text>
                    <Text style={[styles.th, { flex: 1 }]}>Selling</Text>
                  </>
                )}
              </View>
              {booking.visaEntries.map((v, i) => (
                <View key={i} style={i % 2 === 1 ? styles.tableRowAlt : styles.tableRow}>
                  <Text style={[styles.td, { flex: 1.6 }]}>{v.applicantName}</Text>
                  <Text style={[styles.td, { flex: 1.5 }]}>{v.visaCategory}</Text>
                  <Text style={[styles.td, { flex: 1.3 }]}>{v.passportNumber}</Text>
                  <Text style={[styles.td, { flex: 1.3 }]}>{fmtDate(v.expiryDate)}</Text>
                  {isInvoice && (
                    <>
                      <Text style={[styles.td, { flex: 1 }]}>{money(v.buyingCost, booking.currency)}</Text>
                      <Text style={[styles.td, { flex: 1 }]}>{money(v.sellingPrice, booking.currency)}</Text>
                    </>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Voucher shows the total selling price across every included
            service, but never buying cost or profit. */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryLine}><Text style={styles.infoLabel}>Subtotal</Text><Text>{money(grossSelling, booking.currency)}</Text></View>
          {booking.discount > 0 && (
            <View style={styles.summaryLine}><Text style={styles.infoLabel}>Discount</Text><Text>-{money(booking.discount, booking.currency)}</Text></View>
          )}
          <View style={styles.summaryLine}><Text style={styles.infoLabel}>VAT ({booking.vatPercent || 0}%)</Text><Text>{money(vatAmount, booking.currency)}</Text></View>
          {isInvoice && (
            <View style={styles.summaryLine}><Text style={styles.infoLabel}>Net Profit</Text><Text>{money(totals.profit, booking.currency)}</Text></View>
          )}
          <View style={styles.summaryTotalLine}>
            <Text style={styles.summaryTotalLabel}>TOTAL</Text>
            <Text style={styles.summaryTotalValue}>{money(totals.netTotal, booking.currency)}</Text>
          </View>
        </View>

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
              <View style={styles.footerCol}>
                <Text style={styles.footerTitle}>Contact</Text>
                {agency.importantContact && <Text style={styles.footerText}>{agency.importantContact}</Text>}
                {booking.note && <Text style={styles.footerText}>Note: {booking.note}</Text>}
              </View>
            </View>
          ) : (
            <View style={styles.footerCol}>
              <Text style={styles.footerTitle}>Contact</Text>
              {agency.importantContact && <Text style={styles.footerText}>{agency.importantContact}</Text>}
            </View>
          )}

          {agency.cancellationPolicy && <Text style={styles.policyText}>Cancellation Policy: {agency.cancellationPolicy}</Text>}
          {agency.noShowPolicy && <Text style={styles.policyText}>No-Show Policy: {agency.noShowPolicy}</Text>}

          <View style={styles.signOff}>
            <Text style={styles.signOffText}>Dear {booking.guestName},</Text>
            <Text style={styles.signOffText}>Thank you for choosing us — we look forward to serving you.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}