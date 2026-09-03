import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  FlatList,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Modal,
  Share,
  Platform,
  Alert,
  ToastAndroid,
} from "react-native";
import React, { useState } from "react";
import { colors } from "../../utils/constants";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Icon1 from "react-native-vector-icons/Entypo";
import Icon2 from "react-native-vector-icons/MaterialCommunityIcons";
import Icon3 from "react-native-vector-icons/FontAwesome6";
import Icon4 from "react-native-vector-icons/Ionicons";
import Icon5 from "react-native-vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

// ─────────────────────────────────────────────────────────────
// Date helpers — NO moment
// ─────────────────────────────────────────────────────────────
const safeDate = (d) => {
  if (!d) return new Date();
  if (d instanceof Date) return d;
  if (typeof d === "number") return new Date(d);
  if (typeof d === "object" && typeof d.valueOf === "function") {
    const v = d.valueOf();
    if (typeof v === "number" && !isNaN(v)) return new Date(v);
  }
  return new Date(d);
};

const fmtDate = (d) => {
  if (!d) return "—";
  const date = safeDate(d);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) +
    " " +
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
};

const fmtNum = (n) => parseFloat(n || 0).toFixed(2);

// ─────────────────────────────────────────────────────────────
// Invoice Bill Modal
// ─────────────────────────────────────────────────────────────
const InvoiceBillModal = ({ visible, onClose, booking }) => {
  const [downloading, setDownloading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [loadingInv, setLoadingInv] = useState(false);

  React.useEffect(() => {
    if (visible && booking?._id) fetchInvoice();
  }, [visible, booking?._id]);

  const fetchInvoice = async () => {
    setLoadingInv(true);
    try {
      const res = await AxiosService.get("payment/invoice/booking/" + booking._id);
      if (res.data?.invoice) setInvoice(res.data.invoice);
    } catch { /* use booking fields */ }
    finally { setLoadingInv(false); }
  };

  if (!visible || !booking) return null;

  const inv = invoice || {};
  const now = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const custName = booking.customer?.customerName || "—";
  const custPhone = booking.customer?.customerPhoneNumber || "—";
  const vendorName = booking.vehicleDetails?.vendorName || "—";
  const veh = booking.vehicleDetails?.foundVehicle;
  const vehicleStr = veh
    ? (veh.vehicleModel || veh.subCategory || "Vehicle") + (veh.licensePlate ? " (" + veh.licensePlate + ")" : "")
    : "—";
  const tripFare = fmtNum(inv.booking?.totalFare || booking.totalFare);
  const advPaid = fmtNum(inv.totalAmount || booking.advanceAmount);
  const cgst = fmtNum(inv.gstDetails?.cgst || parseFloat(advPaid) * 18 / 100 / 2);
  const sgst = fmtNum(inv.gstDetails?.sgst || parseFloat(advPaid) * 18 / 100 / 2);
  const balance = fmtNum(Math.max(0, parseFloat(tripFare) - parseFloat(advPaid)));
  const orderId = inv.payment?.orderId || booking.advanceOrderId || "—";
  const paidStatus = booking.advancePaidOnline ? "PAID" : "PENDING";
  const tripStatus = booking.vendorApprovedStatus === "rejected"
    ? "Rejected"
    : (booking.tripStatus?.charAt(0)?.toUpperCase() + booking.tripStatus?.slice(1) || "—");

  const buildShareText = () => {
    const ln = "─".repeat(40);
    return [
      "AAT WORLD (OPC) PRIVATE LIMITED",
      "GSTIN: 27AABCA1234Z1Z5  |  billing@worldofaat.com",
      ln, "        GST TAX INVOICE", ln,
      "Invoice : " + (inv.invoiceNumber || "AAT-INV-" + String(booking._id).slice(-8).toUpperCase()),
      "Booking : #" + String(booking._id).slice(-8).toUpperCase(),
      "Date    : " + fmtDate(inv.invoiceDate || booking.bookedAt),
      "Status  : " + tripStatus,
      ln,
      "Customer: " + custName + "  Ph: " + custPhone,
      "Vendor  : " + vendorName,
      "Vehicle : " + vehicleStr,
      ln,
      "From    : " + (booking.pickupLocation || "—"),
      "To      : " + (booking.dropLocation || "—"),
      "Pickup  : " + fmtDate(booking.pickupDate),
      "Type    : " + (booking.tripType || "—") + "  KM: " + (booking.totalKm || "—"),
      ln, "AMOUNT BREAKDOWN",
      ("Advance Base").padEnd(28) + "₹" + fmtNum(parseFloat(advPaid) - parseFloat(cgst) - parseFloat(sgst)),
      ("CGST @ 9%").padEnd(28) + "₹" + cgst,
      ("SGST @ 9%").padEnd(28) + "₹" + sgst,
      "Total Advance".padEnd(28) + "₹" + advPaid,
      "Total Trip Fare".padEnd(28) + "₹" + tripFare,
      "Balance".padEnd(28) + "₹" + balance,
      ln,
      "Order ID : " + orderId + "  |  UPI  |  " + paidStatus,
      booking.tripStatus === "cancelled"
        ? "Refund: " + (booking.advanceRefund ? "Refunded" : "Not Refunded") : "",
      ln, "Generated: " + now + "  ·  worldofaat.com",
    ].filter(Boolean).join("\n");
  };

  const buildHTML = (passedInv) => {
    const inv = passedInv || invoice || {};
    const localAdvPaid  = fmtNum(inv.totalAmount || booking.advanceAmount);
    const localCgst     = fmtNum(inv.gstDetails?.cgst || parseFloat(localAdvPaid) * 18 / 100 / 2);
    const localSgst     = fmtNum(inv.gstDetails?.sgst || parseFloat(localAdvPaid) * 18 / 100 / 2);
    const localBase     = fmtNum(parseFloat(localAdvPaid) - parseFloat(localCgst) - parseFloat(localSgst));
    const localTripFare = fmtNum(inv.booking?.totalFare || booking.totalFare);
    const localBalance  = fmtNum(Math.max(0, parseFloat(localTripFare) - parseFloat(localAdvPaid)));
    const localOrderId  = inv.payment?.orderId || booking.advanceOrderId || "—";

    const bookId = "#" + String(booking._id).slice(-8).toUpperCase();
    const invNo = inv.invoiceNumber || ("AAT-INV-" + String(booking._id).slice(-8).toUpperCase());
    const invDate = inv.invoiceDate
      ? fmtDate(inv.invoiceDate)
      : fmtDate(booking.bookedAt);

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;font-size:11px;color:#222;padding:20px;background:#fff}
.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #0B1A3D;padding-bottom:12px;margin-bottom:14px}
.co{font-size:18px;font-weight:700;color:#0B1A3D}.co-sub{font-size:9px;color:#666}
.co-info{font-size:9px;color:#555;margin-top:6px;line-height:1.8}
.inv-meta{text-align:right}
.inv-badge{display:inline-block;background:#EFF6FF;color:#0B1A3D;border:1px solid #DBEAFE;border-radius:4px;padding:2px 8px;font-size:9px;font-weight:700}
.inv-r{font-size:9px;color:#555;margin-top:2px}.inv-v{font-weight:600;color:#222}
.parties{display:flex;gap:12px;margin-bottom:12px}
.party{flex:1;border:1px solid #e0e0e0;border-radius:5px;padding:8px}
.plbl{font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:4px;font-weight:600}
.pname{font-size:11px;font-weight:700}.pinfo{font-size:9px;color:#555;line-height:1.6}
.sec{font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;border-bottom:1px solid #f3f4f6;padding-bottom:3px;margin-bottom:7px;font-weight:600}
.dr{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f9fafb}
.dl{color:#6b7280;font-size:10px}.dv{font-weight:600;color:#222;font-size:10px}
table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:10px}
thead tr{background:#0B1A3D}th{color:#fff;padding:6px 8px;text-align:left;font-size:9px}
td{padding:6px 8px;border-bottom:1px solid #f0f0f0}
tr.sub td{background:#f9fafb;font-weight:600}tr.tot td{background:#0B1A3D;color:#fff;font-weight:700}
.right{text-align:right}
.bal{background:#EFF6FF;border:1px solid #DBEAFE;border-radius:5px;padding:9px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.bal-l{font-size:11px;font-weight:600;color:#0B1A3D}.bal-v{font-size:15px;font-weight:800;color:#0B1A3D}
.pay-box{background:#f9fafb;border:1px solid #e0e0e0;border-radius:5px;padding:9px;margin-bottom:12px}
.pr{display:flex;justify-content:space-between;padding:3px 0}
.pl{color:#6b7280;font-size:10px}.pv{font-weight:600;color:#222;font-size:10px}
.paid{color:#0B1A3D;font-weight:700}.pend{color:#ff9800;font-weight:700}
.footer{border-top:1px solid #e0e0e0;padding-top:8px;display:flex;justify-content:space-between;font-size:8px;color:#9ca3af}
</style></head><body>
<div class="hdr">
  <div><div class="co">AAT WORLD</div><div class="co-sub">(OPC) PRIVATE LIMITED</div>
  <div class="co-info">GSTIN: 27AABCA1234Z1Z5<br/>billing@worldofaat.com · worldofaat.com</div></div>
  <div class="inv-meta"><div class="inv-badge">GST TAX INVOICE</div>
  <div class="inv-r">Invoice: <span class="inv-v">${invNo}</span></div>
  <div class="inv-r">Booking: <span class="inv-v">${bookId}</span></div>
  <div class="inv-r">Date: <span class="inv-v">${invDate}</span></div>
  <div class="inv-r">Status: <span class="inv-v">${tripStatus}</span></div></div>
</div>
<div class="parties">
  <div class="party"><div class="plbl">Customer</div><div class="pname">${custName}</div><div class="pinfo">Phone: ${custPhone}</div></div>
  <div class="party"><div class="plbl">Vendor / Driver</div><div class="pname">${vendorName}</div><div class="pinfo">Vehicle: ${vehicleStr}</div></div>
</div>
<div style="margin-bottom:12px"><div class="sec">Trip Details</div>
<div class="dr"><span class="dl">From</span><span class="dv">${booking.pickupLocation || "—"}</span></div>
<div class="dr"><span class="dl">To</span><span class="dv">${booking.dropLocation || "—"}</span></div>
<div class="dr"><span class="dl">Pickup Date</span><span class="dv">${fmtDate(booking.pickupDate)}</span></div>
<div class="dr"><span class="dl">Trip Type</span><span class="dv">${booking.tripType || "—"}</span></div>
<div class="dr"><span class="dl">Distance</span><span class="dv">${booking.totalKm || "—"} km</span></div></div>
<div class="sec">Amount Breakdown (SAC: 996601)</div>
<table><thead><tr><th>Description</th><th class="right">Base</th><th class="right">CGST 9%</th><th class="right">SGST 9%</th><th class="right">Total</th></tr></thead>
<tbody>
<tr><td>Booking Payment</td><td class="right">&#8377;${localBase}</td><td class="right">&#8377;${localCgst}</td><td class="right">&#8377;${localSgst}</td><td class="right">&#8377;${localAdvPaid}</td></tr>
<tr class="sub"><td colspan="4"><strong>Total Advance (incl. 18% GST)</strong></td><td class="right"><strong>&#8377;${localAdvPaid}</strong></td></tr>
<tr><td colspan="4">Total Trip Fare</td><td class="right">&#8377;${localTripFare}</td></tr>
<tr class="tot"><td colspan="4">Balance from Customer</td><td class="right">&#8377;${localBalance}</td></tr>
</tbody></table>
<div class="bal"><span class="bal-l">Advance Received</span><span class="bal-v">&#8377;${localAdvPaid}</span></div>
<div class="pay-box"><div class="sec" style="margin-bottom:6px">Payment Information</div>
<div class="pr"><span class="pl">Order ID</span><span class="pv" style="font-family:monospace;font-size:9px">${localOrderId}</span></div>
<div class="pr"><span class="pl">Method</span><span class="pv">UPI</span></div>
<div class="pr"><span class="pl">Status</span><span class="${paidStatus === "PAID" ? "paid" : "pend"}">${paidStatus}</span></div>
${booking.tripStatus === "cancelled"
        ? `<div class="pr"><span class="pl">Refund</span><span class="pv" style="color:${booking.advanceRefund ? "#0B1A3D" : "#dc3545"}">${booking.advanceRefund ? "Refunded" : "Not Refunded"}</span></div>`
        : ""}
</div>
<div class="footer"><span>Computer-generated invoice. No signature required.</span><span>Generated: ${now} · worldofaat.com</span></div>
</body></html>`;
  };

  const shareText = async () => {
    try {
      setDownloading(true);
      await Share.share({ message: buildShareText(), title: "AAT Invoice" });
    } catch (e) {
      if (e.message !== "User did not share") console.log("Share error:", e.message);
    } finally { setDownloading(false); }
  };

  const downloadPDF = async () => {
    try {
      setPdfLoading(true);
      const bookId = String(booking._id).slice(-8).toUpperCase();
      const fname = "AAT_Invoice_" + bookId;

      const showOpenAlert = (pdfUri) => {
        Alert.alert(
          "Download Complete",
          "PDF saved successfully to your selected folder. Would you like to view it?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open PDF",
              onPress: async () => {
                try {
                  await Sharing.shareAsync(pdfUri, {
                    mimeType: "application/pdf",
                    dialogTitle: fname,
                    UTI: "com.adobe.pdf",
                  });
                } catch (err) {
                  if (Platform.OS === "android") {
                    ToastAndroid.show("Could not open file: " + err.message, ToastAndroid.SHORT);
                  } else {
                    console.log("Could not open file:", err.message);
                  }
                }
              }
            }
          ]
        );
      };

      // Fetch invoice from backend if not already available
      let activeInvoice = invoice;
      if (!activeInvoice) {
        try {
          const res = await AxiosService.get("payment/invoice/booking/" + booking._id);
          if (res.data?.invoice) {
            activeInvoice = res.data.invoice;
            setInvoice(activeInvoice);
          }
        } catch (err) {
          console.log("Could not fetch invoice from backend, using fallback");
        }
      }

      // expo-print: renders HTML → creates a PDF URI and returns base64 content
      const { uri, base64 } = await Print.printToFileAsync({
        html    : buildHTML(activeInvoice),
        base64  : true,
      });

      if (Platform.OS === "android") {
        let directoryUri = await AsyncStorage.getItem("user_download_directory");
        let hasPermission = false;

        if (directoryUri) {
          try {
            await FileSystem.StorageAccessFramework.readDirectoryAsync(directoryUri);
            hasPermission = true;
          } catch {
            hasPermission = false;
          }
        }

        if (!hasPermission || !directoryUri) {
          ToastAndroid.show("Please select a folder to save the PDF", ToastAndroid.LONG);
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions.granted) {
            directoryUri = permissions.directoryUri;
            await AsyncStorage.setItem("user_download_directory", directoryUri);
            hasPermission = true;
          } else {
            ToastAndroid.show("Permission denied. Could not save PDF.", ToastAndroid.SHORT);
            setPdfLoading(false);
            return;
          }
        }

        if (hasPermission && directoryUri) {
          try {
            const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
              directoryUri,
              fname,
              "application/pdf"
            );
            await FileSystem.writeAsStringAsync(fileUri, base64, {
              encoding: FileSystem.EncodingType.Base64,
            });
            ToastAndroid.show("PDF downloaded successfully!", ToastAndroid.LONG);
            showOpenAlert(fileUri);
          } catch (writeErr) {
            // Self-heal: if directory access is expired or invalid, reset and prompt user once
            await AsyncStorage.removeItem("user_download_directory");
            ToastAndroid.show("Folder access expired. Please select a folder again.", ToastAndroid.SHORT);
            const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
            if (permissions.granted) {
              const newDirectoryUri = permissions.directoryUri;
              await AsyncStorage.setItem("user_download_directory", newDirectoryUri);
              const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
                newDirectoryUri,
                fname,
                "application/pdf"
              );
              await FileSystem.writeAsStringAsync(fileUri, base64, {
                encoding: FileSystem.EncodingType.Base64,
              });
              ToastAndroid.show("PDF downloaded successfully!", ToastAndroid.LONG);
              showOpenAlert(fileUri);
            }
          }
        }
      } else {
        // iOS: move to app document directory and use native Share sheet to allow "Save to Files"
        const destUri = FileSystem.documentDirectory + fname + ".pdf";
        await FileSystem.moveAsync({ from: uri, to: destUri });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(destUri, {
            mimeType: "application/pdf",
            dialogTitle: fname,
            UTI: "com.adobe.pdf",
          });
        } else {
          ToastAndroid.show("PDF saved: " + destUri, ToastAndroid.SHORT);
        }
      }
    } catch (e) {
      console.log("PDF error:", e.message);
      if (Platform.OS === "android") {
        ToastAndroid.show("PDF error: " + e.message, ToastAndroid.SHORT);
      }
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose} />
      <View style={mStyles.sheet}>
        <View style={mStyles.handle} />

        {/* Header */}
        <View style={mStyles.header}>
          <View style={mStyles.header_icon}>
            <Icon3 name="file-invoice" size={18} color={colors.deep_blue} />
          </View>
          <Text style={mStyles.header_title}>Booking Invoice</Text>
          <Pressable onPress={onClose} style={{ padding: 4 }}>
            <Icon5 name="close" size={20} color="#6b7280" />
          </Pressable>
        </View>

        {loadingInv ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 40 }}>
            <ActivityIndicator size="large" color={colors.deep_blue} />
            <Text style={{ color: "#6b7280", marginTop: 12 }}>Loading invoice...</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>

            {/* Booking banner */}
            <View style={mStyles.banner}>
              <View style={mStyles.banner_row}>
                <Text style={mStyles.banner_lbl}>Booking ID</Text>
                <Text style={mStyles.banner_id}>#{String(booking._id).slice(-8).toUpperCase()}</Text>
              </View>
              <View style={mStyles.banner_row}>
                <Text style={mStyles.banner_lbl}>Status</Text>
                <View style={[mStyles.status_pill,
                booking.tripStatus === "completed" ? { backgroundColor: "#d1fae5" } :
                  booking.tripStatus === "cancelled" ? { backgroundColor: "#ffebee" } :
                    { backgroundColor: "#fff3e0" }]}>
                  <Text style={mStyles.status_pill_txt}>
                    {booking.tripStatus === "completed" ? "✅ Completed" :
                      booking.tripStatus === "cancelled" ? "❌ Cancelled" : "🚫 Rejected"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Payment summary */}
            <View style={mStyles.summary}>
              <Text style={mStyles.summary_heading}>Payment Summary</Text>
              <View style={mStyles.summary_row}>
                <Text style={mStyles.s_lbl}>Advance Received</Text>
                <Text style={mStyles.s_val}>₹ {advPaid}</Text>
              </View>
              <View style={mStyles.gst_row}>
                <Text style={mStyles.gst_sub}>CGST ₹{cgst}</Text>
                <Text style={mStyles.gst_sub}>+</Text>
                <Text style={mStyles.gst_sub}>SGST ₹{sgst}</Text>
              </View>
              <View style={mStyles.summary_div} />
              <View style={mStyles.summary_row}>
                <Text style={mStyles.s_lbl}>Total Trip Fare</Text>
                <Text style={[mStyles.s_val, { fontSize: 14, color: "#374151" }]}>₹ {tripFare}</Text>
              </View>
              <View style={mStyles.summary_row}>
                <Text style={mStyles.s_lbl}>Balance from Customer</Text>
                <Text style={[mStyles.s_val, { fontSize: 14, color: "#16a34a" }]}>₹ {balance}</Text>
              </View>
              {booking.tripStatus === "cancelled" ? (
                <View style={mStyles.summary_row}>
                  <Text style={mStyles.s_lbl}>Refund Status</Text>
                  <Text style={[mStyles.s_val, {
                    fontSize: 13,
                    color: booking.advanceRefund ? "#16a34a" : "#dc3545"
                  }]}>
                    {booking.advanceRefund ? "✅ Refunded" : "❌ Not Refunded"}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Detail rows */}
            {[
              { label: "Customer", val: custName },
              { label: "Phone", val: custPhone },
              { label: "Order ID", val: orderId, mono: true },
              { label: "Method", val: "UPI" },
              { label: "Adv. Status", val: paidStatus === "PAID" ? "✅ Paid" : "⏳ Pending" },
              { label: "From", val: booking.pickupLocation },
              { label: "To", val: booking.dropLocation },
              { label: "Pickup", val: fmtDate(booking.pickupDate) },
              booking.returnDate ? { label: "Return", val: fmtDate(booking.returnDate) } : null,
              { label: "Trip Type", val: booking.tripType || "—" },
              { label: "KM", val: (booking.totalKm || "—") + " km" },
            ].filter(Boolean).map(r => (
              <View key={r.label} style={mStyles.info_row}>
                <Text style={mStyles.info_lbl}>{r.label}</Text>
                <Text style={[mStyles.info_val,
                r.mono ? { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontSize: 11 } : {}]}
                  numberOfLines={1}>{r.val}</Text>
              </View>
            ))}

            <View style={mStyles.divider} />

            {/* Download card */}
            <View style={mStyles.card}>
              <View style={mStyles.card_hdr}>
                <Icon3 name="file-invoice-dollar" size={18} color="#1d4ed8" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={mStyles.card_title}>GST Invoice</Text>
                  <Text style={mStyles.card_sub}>SAC 996601 · CGST 9% + SGST 9%</Text>
                </View>
                <View style={mStyles.gst_badge}>
                  <Text style={mStyles.gst_badge_txt}>18% GST</Text>
                </View>
              </View>
              <View style={mStyles.btn_row}>
                <TouchableOpacity
                  style={[mStyles.action_btn, { backgroundColor: "#1d4ed8", flex: 1 }]}
                  onPress={shareText} disabled={downloading || pdfLoading}>
                  {downloading ? <ActivityIndicator size="small" color="#fff" /> : (
                    <><Icon3 name="share-nodes" size={12} color="#fff" /><Text style={mStyles.btn_txt}>Share</Text></>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[mStyles.action_btn, { backgroundColor: "#dc2626", flex: 1 }]}
                  onPress={downloadPDF} disabled={downloading || pdfLoading}>
                  {pdfLoading ? <ActivityIndicator size="small" color="#fff" /> : (
                    <><Icon3 name="file-pdf" size={12} color="#fff" /><Text style={mStyles.btn_txt}>PDF</Text></>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={mStyles.footer_note}>
              Share → WhatsApp / email · PDF → saves to device
            </Text>
          </ScrollView>
        )}

        <View style={mStyles.footer}>
          <TouchableOpacity style={mStyles.close_btn} onPress={onClose}>
            <Text style={mStyles.close_btn_txt}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const mStyles = StyleSheet.create({
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "90%", flexDirection: "column" },
  handle: { width: 40, height: 4, backgroundColor: "#d1d5db", borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: 10 },
  header_icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#F0F4FF", alignItems: "center", justifyContent: "center" },
  header_title: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  banner: { backgroundColor: "#f9fafb", borderColor: "#e5e7eb", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14, gap: 8 },
  banner_row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  banner_lbl: { fontSize: 12, color: "#9ca3af" },
  banner_id: { fontSize: 13, fontWeight: "700", color: "#111827", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },
  status_pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  status_pill_txt: { fontSize: 12, fontWeight: "600", color: "#374151" },
  summary: { backgroundColor: "#F0F4FF", borderColor: "#bbf7d0", borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 14 },
  summary_heading: { fontSize: 13, fontWeight: "700", color: colors.deep_blue, marginBottom: 10 },
  summary_row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  gst_row: { flexDirection: "row", gap: 6, marginBottom: 8 },
  s_lbl: { fontSize: 13, color: "#6b7280" },
  s_val: { fontSize: 17, fontWeight: "800", color: "#16a34a" },
  gst_sub: { fontSize: 10, color: "#9ca3af" },
  summary_div: { height: 1, backgroundColor: "#d1fae5", marginVertical: 8 },
  info_row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#f9fafb" },
  info_lbl: { fontSize: 12, color: "#9ca3af" },
  info_val: { fontSize: 12, fontWeight: "600", color: "#111827", flex: 1, textAlign: "right" },
  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 14 },
  card: { borderWidth: 1, borderColor: "#bfdbfe", borderRadius: 12, padding: 14, marginBottom: 14, backgroundColor: "#f8faff" },
  card_hdr: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  card_title: { fontSize: 14, fontWeight: "700", color: "#1e40af" },
  card_sub: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  gst_badge: { backgroundColor: "#dbeafe", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  gst_badge_txt: { fontSize: 9, color: "#1e40af", fontWeight: "700" },
  btn_row: { flexDirection: "row", gap: 8 },
  action_btn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 9 },
  btn_txt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  footer_note: { fontSize: 11, color: "#9ca3af", textAlign: "center", marginBottom: 8 },
  footer: { paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  close_btn: { backgroundColor: "#f3f4f6", paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  close_btn_txt: { fontSize: 15, fontWeight: "600", color: "#374151" },
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const PastBookings = () => {
  const [showButton, setShowButton] = useState(false);
  const [filtered, setFiltered] = useState("all");
  const [loading, setLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [billModal, setBillModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const navigation = useNavigation();

  useFocusEffect(React.useCallback(() => { getBookings(); }, []));

  const onRefresh = async () => { setRefreshing(true); await getBookings(); setRefreshing(false); };

  const filteredData = filtered === "all"
    ? bookingDetails
    : bookingDetails.filter((book) => book.tripStatus === filtered);

  const handleButton = () => { setFiltered("all"); setShowButton(!showButton); };
  const handleApproved = () => { setFiltered("completed"); setShowButton(false); };
  const handlePending = () => { setFiltered("cancelled"); setShowButton(false); };

  const getBookings = async () => {
    try {
      setLoading(true);
      const vendor = await AsyncStorage.getItem("user");
      const vendorData = JSON.parse(vendor);
      const res = await AxiosService.get(`vendor/getBookingsByVendorId/${vendorData._id}`);
      const data = res.data.bookings;
      const filtered = data.filter(item =>
        item.vendorApprovedStatus === "rejected" ||
        item.tripStatus === "completed" ||
        item.tripStatus === "cancelled"
      );
      if (res.status === 200) setBookingDetails(filtered);
    } catch (error) {
      console.error(error.response ? error.response.data.error : error.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "#4CAF50";
      case "cancelled": return "#F44336";
      default: return "#FF9800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed": return "checkmark-circle";
      case "cancelled": return "close-circle";
      default: return "time";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.deep_blue} />
        <Text style={styles.loadingText}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.deep_blue} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Past Bookings</Text>
        <Text style={styles.headerSubtitle}>View your booking history</Text>
      </View>

      {/* Filter section */}
      {bookingDetails.length > 0 ? (
        <View style={styles.filterSection}>
          <TouchableOpacity style={styles.filterMainButton} onPress={handleButton}>
            <Icon4 name="filter" size={18} color={colors.deep_blue} />
            <Text style={styles.filterMainButtonText}>
              {filtered === "all" ? "All Bookings" : filtered.charAt(0).toUpperCase() + filtered.slice(1)}
            </Text>
            <Icon4 name={showButton ? "chevron-up" : "chevron-down"} size={16} color={colors.dark_gray} />
          </TouchableOpacity>

          {showButton ? (
            <View style={styles.filterOptionsContainer}>
              <TouchableOpacity
                style={[styles.filterOption, filtered === "completed" && styles.filterOptionActive]}
                onPress={handleApproved}>
                <View style={[styles.statusDot, { backgroundColor: "#4CAF50" }]} />
                <Text style={[styles.filterOptionText, filtered === "completed" && styles.filterOptionTextActive]}>
                  Completed
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterOption, filtered === "cancelled" && styles.filterOptionActive]}
                onPress={handlePending}>
                <View style={[styles.statusDot, { backgroundColor: "#F44336" }]} />
                <Text style={[styles.filterOptionText, filtered === "cancelled" && styles.filterOptionTextActive]}>
                  Cancelled
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* List */}
      {filteredData.length === 0 ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <Image source={require("../../assets/Images/no-history.png")} style={styles.emptyImage} />
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptySubtitle}>
            {filtered === "all" ? "You don't have any past bookings yet" : `No ${filtered} bookings`}
          </Text>
          {filtered !== "all" ? (
            <TouchableOpacity style={styles.clearFilterButton} onPress={() => setFiltered("all")}>
              <Text style={styles.clearFilterButtonText}>View All Bookings</Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      ) : (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          data={filteredData}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => navigation.navigate("AutoBookingDetails", { bookingDetails: item })}
              style={({ pressed }) => [styles.bookingCard, pressed && styles.bookingCardPressed]}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.customerInfo}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {item.customer.customerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.customerName}>{item.customer.customerName}</Text>
                    <Text style={styles.bookingDate}>{fmtDate(item.bookedAt)}</Text>
                  </View>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.tripStatus) + "15" }]}>
                    <Icon4 name={getStatusIcon(item.tripStatus)} size={14} color={getStatusColor(item.tripStatus)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.tripStatus) }]}>
                      {item.tripStatus.charAt(0).toUpperCase() + item.tripStatus.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Booking ID */}
              <View style={styles.bookingIdContainer}>
                <Icon4 name="receipt-outline" size={14} color={colors.dark_gray} />
                <Text style={styles.bookingIdText}>
                  Booking ID: #{String(item._id).slice(-8).toUpperCase()}
                </Text>
              </View>

              {/* Card Content */}
              <View style={styles.cardContent}>
                <View style={styles.detailRow}>
                  <Icon4 name="car-outline" size={16} color={colors.deep_blue} />
                  <Text style={styles.detailLabel}>Vehicle:</Text>
                  <Text style={styles.detailValue}>{item?.vehicleDetails?.foundVehicle?.licensePlate || "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Icon4 name="calendar-outline" size={16} color={colors.deep_blue} />
                  <Text style={styles.detailLabel}>Pickup:</Text>
                  <Text style={styles.detailValue}>{fmtDate(item.pickupDate)}</Text>
                </View>
                {item.tripType ? (
                  <View style={styles.detailRow}>
                    <Icon4 name="swap-horizontal-outline" size={16} color={colors.deep_blue} />
                    <Text style={styles.detailLabel}>Trip:</Text>
                    <Text style={styles.detailValue}>{item.tripType}</Text>
                  </View>
                ) : null}
                {item.tripStatus === "completed" ? (
                  <View style={styles.detailRow}>
                    <Icon4 name="flag-outline" size={16} color={colors.deep_blue} />
                    <Text style={styles.detailLabel}>Drop:</Text>
                    <Text style={styles.detailValue}>
                      {fmtDate(item.returnDate || item.pickupDate)}
                    </Text>
                  </View>
                ) : null}
                {item.tripStatus === "cancelled" ? (
                  <View style={styles.reasonContainer}>
                    <Icon4 name="information-circle" size={16} color="#F44336" />
                    <Text style={styles.reasonText} numberOfLines={2}>
                      {item.vendorRejectedReason || item.customerCancelledReason || "No reason provided"}
                    </Text>
                  </View>
                ) : null}

                {/* Fare Summary */}
                <View style={styles.fareSummary}>
                  <View>
                    <Text style={styles.fareLabel}>Total Amount</Text>
                    <Text style={styles.fareValue}>₹{fmtNum(item.totalFare)}</Text>
                  </View>
                  {item.advanceAmount > 0 ? (
                    <View style={styles.advanceBadge}>
                      <Icon4 name="shield-checkmark" size={12} color={colors.deep_blue} />
                      <Text style={styles.advanceText}>Advance Paid</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.textLink}
                  onPress={() => { setSelectedBooking(item); setBillModal(true); }}
                >
                  <Icon3 name="file-invoice" size={14} color={colors.deep_blue} />
                  <Text style={styles.textLinkLabel}>Invoice / PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => navigation.navigate("AutoBookingDetails", { bookingDetails: item })}
                >
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <Icon4 name="arrow-forward" size={16} color={colors.deep_blue} />
                </TouchableOpacity>
              </View>
            </Pressable>
          )}
        />
      )}

      <InvoiceBillModal
        visible={billModal}
        onClose={() => { setBillModal(false); setSelectedBooking(null); }}
        booking={selectedBooking}
      />
    </View>
  );
};

export default PastBookings;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
  loadingText: { marginTop: 12, fontSize: 14, color: colors.dark_gray, fontWeight: "500" },
  header: { backgroundColor: colors.deep_blue, paddingTop: 50, paddingBottom: 25, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 5 },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  filterSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  filterMainButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#E0E0E0", gap: 8, elevation: 2 },
  filterMainButtonText: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.dark_gray },
  filterOptionsContainer: { flexDirection: "row", marginTop: 8, gap: 8 },
  filterOption: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#fff", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: "#E0E0E0", gap: 6 },
  filterOptionActive: { backgroundColor: colors.deep_blue, borderColor: colors.deep_blue },
  filterOptionText: { fontSize: 13, fontWeight: "600", color: colors.dark_gray },
  filterOptionTextActive: { color: "#fff" },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  listContainer: { padding: 16, paddingTop: 8 },
  emptyContainer: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  emptyImage: { height: hp(25), width: wp(80), resizeMode: "contain", marginBottom: 20 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: colors.deep_blue, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: "center", fontWeight: "500", color: colors.dark_gray, marginBottom: 20 },
  clearFilterButton: { backgroundColor: colors.deep_blue, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  clearFilterButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  bookingCard: { backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, padding: 16, borderWidth: 1, borderColor: "#F0F0F0", elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  bookingCardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  customerInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarContainer: { width: 45, height: 45, borderRadius: 12, backgroundColor: "#F0F4FF", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: colors.deep_blue },
  customerName: { fontSize: 16, fontWeight: "700", color: colors.black, marginBottom: 4 },
  bookingDate: { fontSize: 12, color: colors.dark_gray, fontWeight: "500" },
  statusContainer: { alignItems: "flex-end" },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  bookingIdContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#F8F9FA", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginBottom: 12, gap: 6 },
  bookingIdText: { fontSize: 12, color: colors.dark_gray, fontWeight: "500" },
  cardContent: { gap: 8, marginBottom: 12 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailLabel: { fontSize: 13, fontWeight: "600", color: colors.dark_gray, width: 60 },
  detailValue: { flex: 1, fontSize: 13, fontWeight: "500", color: colors.black },
  reasonContainer: { flexDirection: "row", backgroundColor: "#FFEBEE", padding: 10, borderRadius: 8, gap: 8, marginTop: 4 },
  reasonText: { flex: 1, fontSize: 12, color: "#F44336", fontWeight: "500" },
  fareSummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  fareLabel: { fontSize: 11, color: colors.dark_gray, fontWeight: "500", marginBottom: 2 },
  fareValue: { fontSize: 18, fontWeight: "700", color: colors.deep_blue },
  advanceBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#F0F4FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 4 },
  advanceText: { fontSize: 11, fontWeight: "600", color: colors.deep_blue },
  actionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  textLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textLinkLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.deep_blue,
  },
  invoiceBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: colors.deep_blue, backgroundColor: "#F0F4FF" },
  invoiceBtnTxt: { fontSize: 13, fontWeight: "600", color: colors.deep_blue },
  viewDetailsButton: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewDetailsText: { fontSize: 14, fontWeight: "600", color: colors.deep_blue },
});