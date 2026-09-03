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
  Dimensions,
  Modal,
  Share,
  Platform,
  Animated,
  Alert,
  ToastAndroid,
} from "react-native";
import React, { useEffect, useState } from "react";
import { colors } from "../../utils/constants";
import { useFocusEffect } from "@react-navigation/native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Icon  from "react-native-vector-icons/MaterialIcons";
import Icon1 from "react-native-vector-icons/Entypo";
import Icon2 from "react-native-vector-icons/MaterialCommunityIcons";
import Icon3 from "react-native-vector-icons/FontAwesome6";
import Icon4 from "react-native-vector-icons/Ionicons";
import Icon5 from "react-native-vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AxiosService from "../../utils/AxioService";
import * as Print      from "expo-print";
import * as Sharing    from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";

// Vehicle images
import carImg         from "../../assets/Images/car5.png";
import autoImg        from "../../assets/Images/auto.png";
import vanImg         from "../../assets/Images/van.png";
import busImg         from "../../assets/Images/bus.png";
import smallTruckImg  from "../../assets/Images/under1-ton.jpg";
import mediumTruckImg from "../../assets/Images/XL-truck.png";
import largeTruckImg  from "../../assets/Images/below-20-ton.png";
import XLTruckImg     from "../../assets/Images/moreThen20-ton.png";

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
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [invoice, setInvoice]         = useState(null);
  const [loadingInv, setLoadingInv]   = useState(false);

  const [showModal, setShowModal] = useState(visible);
  const [localBooking, setLocalBooking] = useState(booking);
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      setLocalBooking(booking);
      setShowModal(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
        setLocalBooking(null);
      });
    }
  }, [visible]);

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

  if (!showModal || !localBooking) return null;

  const bookingData = localBooking;
  const inv        = invoice || {};
  const now        = new Date().toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  const custName   = bookingData.customer?.customerName        || "—";
  const custPhone  = bookingData.customer?.customerPhoneNumber || "—";
  const vendorName = bookingData.vehicleDetails?.vendorName    || "—";
  const veh        = bookingData.vehicleDetails?.foundVehicle;
  const vehicleStr = veh
    ? (veh.vehicleModel || veh.subCategory || "Vehicle") + (veh.licensePlate ? " (" + veh.licensePlate + ")" : "")
    : "—";
  const tripFare   = fmtNum(inv.booking?.totalFare  || bookingData.totalFare);
  const advPaid    = fmtNum(inv.totalAmount         || bookingData.advanceAmount);
  const cgst       = fmtNum(inv.gstDetails?.cgst    || parseFloat(advPaid) * 18 / 100 / 2);
  const sgst       = fmtNum(inv.gstDetails?.sgst    || parseFloat(advPaid) * 18 / 100 / 2);
  const balance    = fmtNum(Math.max(0, parseFloat(tripFare) - parseFloat(advPaid)));
  const orderId    = inv.payment?.orderId           || bookingData.advanceOrderId || "—";
  const paidStatus = bookingData.advancePaidOnline ? "PAID" : "PENDING";
  const tripStatus = bookingData.vendorApprovedStatus?.charAt(0)?.toUpperCase() + bookingData.vendorApprovedStatus?.slice(1) || "—";

  const buildShareText = () => {
    const ln = "─".repeat(40);
    return [
      "AAT WORLD (OPC) PRIVATE LIMITED",
      "GSTIN: 27AABCA1234Z1Z5  |  billing@worldofaat.com",
      ln, "        GST TAX INVOICE", ln,
      "Invoice : " + (inv.invoiceNumber || "AAT-INV-" + String(bookingData._id).slice(-8).toUpperCase()),
      "Booking : #" + String(bookingData._id).slice(-8).toUpperCase(),
      "Date    : " + fmtDate(inv.invoiceDate || bookingData.bookedAt),
      "Status  : " + tripStatus,
      ln,
      "Customer: " + custName + "  Ph: " + custPhone,
      "Vendor  : " + vendorName,
      "Vehicle : " + vehicleStr,
      ln,
      "From    : " + (bookingData.pickupLocation || "—"),
      "To      : " + (bookingData.dropLocation   || "—"),
      "Pickup  : " + fmtDate(bookingData.pickupDate),
      "Type    : " + (bookingData.tripType || "—") + "  KM: " + (bookingData.totalKm || "—"),
      ln, "AMOUNT BREAKDOWN",
      ("Advance Base").padEnd(28) + "₹" + fmtNum(parseFloat(advPaid) - parseFloat(cgst) - parseFloat(sgst)),
      ("CGST @ 9%").padEnd(28) + "₹" + cgst,
      ("SGST @ 9%").padEnd(28) + "₹" + sgst,
      "Total Advance".padEnd(28) + "₹" + advPaid,
      "Total Trip Fare".padEnd(28) + "₹" + tripFare,
      "Balance (from customer)".padEnd(28) + "₹" + balance,
      ln,
      "Order ID : " + orderId + "  |  UPI  |  " + paidStatus,
      ln, "Generated: " + now + "  ·  worldofaat.com",
    ].filter(Boolean).join("\n");
  };

  const buildHTML = (passedInv) => {
    const inv = passedInv || invoice || {};
    const localAdvPaid  = fmtNum(inv.totalAmount || bookingData.advanceAmount);
    const localCgst     = fmtNum(inv.gstDetails?.cgst || parseFloat(localAdvPaid) * 18 / 100 / 2);
    const localSgst     = fmtNum(inv.gstDetails?.sgst || parseFloat(localAdvPaid) * 18 / 100 / 2);
    const localBase     = fmtNum(parseFloat(localAdvPaid) - parseFloat(localCgst) - parseFloat(localSgst));
    const localTripFare = fmtNum(inv.booking?.totalFare || bookingData.totalFare);
    const localBalance  = fmtNum(Math.max(0, parseFloat(localTripFare) - parseFloat(localAdvPaid)));
    const localOrderId  = inv.payment?.orderId || bookingData.advanceOrderId || "—";

    const bookId = "#" + String(bookingData._id).slice(-8).toUpperCase();
    const invNo  = inv.invoiceNumber || ("AAT-INV-" + String(bookingData._id).slice(-8).toUpperCase());
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;color:#222;padding:20px}
.hdr{display:flex;justify-content:space-between;border-bottom:2px solid #0B1A3D;padding-bottom:12px;margin-bottom:14px}
.co{font-size:18px;font-weight:700;color:#0B1A3D}.co-sub{font-size:9px;color:#666}.co-info{font-size:9px;color:#555;margin-top:6px;line-height:1.8}
.inv-meta{text-align:right}.inv-badge{display:inline-block;background:#EFF6FF;color:#0B1A3D;border:1px solid #DBEAFE;border-radius:4px;padding:2px 8px;font-size:9px;font-weight:700}
.inv-r{font-size:9px;color:#555;margin-top:2px}.inv-v{font-weight:600;color:#222}
.parties{display:flex;gap:12px;margin-bottom:12px}.party{flex:1;border:1px solid #e0e0e0;border-radius:5px;padding:8px}
.plbl{font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;margin-bottom:4px;font-weight:600}
.pname{font-size:11px;font-weight:700}.pinfo{font-size:9px;color:#555;line-height:1.6}
.sec{font-size:8px;text-transform:uppercase;letter-spacing:.5px;color:#9ca3af;border-bottom:1px solid #f3f4f6;padding-bottom:3px;margin-bottom:7px;font-weight:600}
.dr{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f9fafb}.dl{color:#6b7280;font-size:10px}.dv{font-weight:600;color:#222;font-size:10px}
table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:10px}thead tr{background:#0B1A3D}
th{color:#fff;padding:6px 8px;text-align:left;font-size:9px}td{padding:6px 8px;border-bottom:1px solid #f0f0f0}
tr.sub td{background:#f9fafb;font-weight:600}tr.tot td{background:#0B1A3D;color:#fff;font-weight:700}.right{text-align:right}
.bal{background:#EFF6FF;border:1px solid #DBEAFE;border-radius:5px;padding:9px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.bal-l{font-size:11px;font-weight:600;color:#0B1A3D}.bal-v{font-size:15px;font-weight:800;color:#0B1A3D}
.pay-box{background:#f9fafb;border:1px solid #e0e0e0;border-radius:5px;padding:9px;margin-bottom:12px}
.pr{display:flex;justify-content:space-between;padding:3px 0}.pl{color:#6b7280;font-size:10px}.pv{font-weight:600;color:#222;font-size:10px}
.paid{color:#0B1A3D;font-weight:700}.pend{color:#ff9800;font-weight:700}
.footer{border-top:1px solid #e0e0e0;padding-top:8px;display:flex;justify-content:space-between;font-size:8px;color:#9ca3af}
</style></head><body>
<div class="hdr">
  <div><div class="co">AAT WORLD</div><div class="co-sub">(OPC) PRIVATE LIMITED</div>
  <div class="co-info">GSTIN: 27AABCA1234Z1Z5<br/>billing@worldofaat.com</div></div>
  <div class="inv-meta"><div class="inv-badge">GST TAX INVOICE</div>
  <div class="inv-r">Invoice: <span class="inv-v">${invNo}</span></div>
  <div class="inv-r">Booking: <span class="inv-v">${bookId}</span></div>
  <div class="inv-r">Date: <span class="inv-v">${fmtDate(inv.invoiceDate || bookingData.bookedAt)}</span></div>
  <div class="inv-r">Status: <span class="inv-v">${tripStatus}</span></div></div>
</div>
<div class="parties">
  <div class="party"><div class="plbl">Customer</div><div class="pname">${custName}</div><div class="pinfo">Phone: ${custPhone}</div></div>
  <div class="party"><div class="plbl">Vendor / Driver</div><div class="pname">${vendorName}</div><div class="pinfo">Vehicle: ${vehicleStr}</div></div>
</div>
<div style="margin-bottom:12px"><div class="sec">Trip Details</div>
<div class="dr"><span class="dl">From</span><span class="dv">${bookingData.pickupLocation || "—"}</span></div>
<div class="dr"><span class="dl">To</span><span class="dv">${bookingData.dropLocation || "—"}</span></div>
<div class="dr"><span class="dl">Pickup Date</span><span class="dv">${fmtDate(bookingData.pickupDate)}</span></div>
<div class="dr"><span class="dl">Trip Type</span><span class="dv">${bookingData.tripType || "—"}</span></div>
<div class="dr"><span class="dl">Distance</span><span class="dv">${bookingData.totalKm || "—"} km</span></div>
<div class="dr"><span class="dl">Trip Status</span><span class="dv">${bookingData.tripStatus || "—"}</span></div></div>
<div class="sec">Amount Breakdown (SAC: 996601)</div>
<table><thead><tr><th>Description</th><th class="right">Base</th><th class="right">CGST 9%</th><th class="right">SGST 9%</th><th class="right">Total</th></tr></thead>
<tbody>
<tr><td>Advance Payment</td><td class="right">&#8377;${localBase}</td><td class="right">&#8377;${localCgst}</td><td class="right">&#8377;${localSgst}</td><td class="right">&#8377;${localAdvPaid}</td></tr>
<tr class="sub"><td colspan="4"><strong>Total Advance (incl. 18% GST)</strong></td><td class="right"><strong>&#8377;${localAdvPaid}</strong></td></tr>
<tr><td colspan="4">Total Trip Fare</td><td class="right">&#8377;${localTripFare}</td></tr>
<tr class="tot"><td colspan="4">Balance from Customer</td><td class="right">&#8377;${localBalance}</td></tr>
</tbody></table>
<div class="bal"><span class="bal-l">Advance Received</span><span class="bal-v">&#8377;${localAdvPaid}</span></div>
<div class="pay-box"><div class="sec" style="margin-bottom:6px">Payment Info</div>
<div class="pr"><span class="pl">Order ID</span><span class="pv" style="font-family:monospace;font-size:9px">${localOrderId}</span></div>
<div class="pr"><span class="pl">Method</span><span class="pv">UPI</span></div>
<div class="pr"><span class="pl">Status</span><span class="${paidStatus === "PAID" ? "paid" : "pend"}">${paidStatus}</span></div>
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
      const bookId  = String(bookingData._id).slice(-8).toUpperCase();
      const fname   = "AAT_Invoice_" + bookId;

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
          const res = await AxiosService.get("payment/invoice/booking/" + bookingData._id);
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
    <Modal visible={showModal} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={mStyles.overlay} onPress={onClose} />
      <Animated.View style={[mStyles.sheet, {
        transform: [{
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-height, 0],
          })
        }]
      }]}>
        <View style={mStyles.handle} />
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
          <View style={{ flex:1, justifyContent:"center", alignItems:"center", padding:40 }}>
            <ActivityIndicator size="large" color={colors.deep_blue} />
            <Text style={{ color:"#6b7280", marginTop:12 }}>Loading invoice...</Text>
          </View>
        ) : (
          <ScrollView style={{ flex:1 }} contentContainerStyle={{ padding:20 }} showsVerticalScrollIndicator={false}>

            <View style={mStyles.banner}>
              <View style={mStyles.banner_row}>
                <Text style={mStyles.banner_lbl}>Booking ID</Text>
                <Text style={mStyles.banner_id}>#{String(bookingData._id).slice(-8).toUpperCase()}</Text>
              </View>
              <View style={mStyles.banner_row}>
                <Text style={mStyles.banner_lbl}>Approval</Text>
                <View style={[mStyles.status_pill,
                  bookingData.vendorApprovedStatus === "approved"
                    ? { backgroundColor:"#d1fae5" }
                    : { backgroundColor:"#fff3e0" }]}>
                  <Text style={mStyles.status_pill_txt}>
                    {bookingData.vendorApprovedStatus === "approved" ? "✅ Approved" : "⏳ Pending"}
                  </Text>
                </View>
              </View>
              <View style={mStyles.banner_row}>
                <Text style={mStyles.banner_lbl}>Trip Status</Text>
                <Text style={[mStyles.banner_lbl, { color:"#374151", fontWeight:"600" }]}>
                  {bookingData.tripStatus === "start" ? "Yet to start" : (bookingData.tripStatus || "—")}
                </Text>
              </View>
            </View>

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
                <Text style={[mStyles.s_val, { fontSize:14, color:"#374151" }]}>₹ {tripFare}</Text>
              </View>
              <View style={mStyles.summary_row}>
                <Text style={mStyles.s_lbl}>Balance from Customer</Text>
                <Text style={[mStyles.s_val, { fontSize:14, color:"#16a34a" }]}>₹ {balance}</Text>
              </View>
            </View>

            {[
              { label:"Customer",    val:custName },
              { label:"Phone",       val:custPhone },
              { label:"Order ID",    val:orderId, mono:true },
              { label:"Method",      val:"UPI" },
              { label:"Adv. Status", val:paidStatus === "PAID" ? "✅ Paid" : "⏳ Pending" },
              { label:"From",        val:bookingData.pickupLocation },
              { label:"To",          val:bookingData.dropLocation },
              { label:"Pickup",      val:fmtDate(bookingData.pickupDate) },
              { label:"Trip Type",   val:bookingData.tripType || "—" },
              { label:"KM",          val:(bookingData.totalKm || "—") + " km" },
            ].map(r => (
              <View key={r.label} style={mStyles.info_row}>
                <Text style={mStyles.info_lbl}>{r.label}</Text>
                <Text style={[mStyles.info_val,
                  r.mono ? { fontFamily:Platform.OS === "ios" ? "Courier" : "monospace", fontSize:11 } : {}]}
                  numberOfLines={1}>{r.val}</Text>
              </View>
            ))}

            <View style={mStyles.divider} />

            <View style={mStyles.card}>
              <View style={mStyles.card_hdr}>
                <Icon3 name="file-invoice-dollar" size={18} color="#1d4ed8" />
                <View style={{ flex:1, marginLeft:10 }}>
                  <Text style={mStyles.card_title}>GST Invoice</Text>
                  <Text style={mStyles.card_sub}>SAC 996601 · CGST 9% + SGST 9%</Text>
                </View>
                <View style={mStyles.gst_badge}><Text style={mStyles.gst_badge_txt}>18% GST</Text></View>
              </View>
              <View style={mStyles.btn_row}>
                <TouchableOpacity style={[mStyles.action_btn, { backgroundColor:"#1d4ed8", flex:1 }]}
                  onPress={shareText} disabled={downloading || pdfLoading}>
                  {downloading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Icon3 name="share-nodes" size={12} color="#fff" /><Text style={mStyles.btn_txt}>Share</Text></>}
                </TouchableOpacity>
                <TouchableOpacity style={[mStyles.action_btn, { backgroundColor:"#dc2626", flex:1 }]}
                  onPress={downloadPDF} disabled={downloading || pdfLoading}>
                  {pdfLoading
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <><Icon3 name="file-pdf" size={12} color="#fff" /><Text style={mStyles.btn_txt}>PDF</Text></>}
                </TouchableOpacity>
              </View>
            </View>

            <Text style={mStyles.footer_note}>Share → WhatsApp/email · PDF → saves to device</Text>
          </ScrollView>
        )}

        <View style={mStyles.footer}>
          <TouchableOpacity style={mStyles.close_btn} onPress={onClose}>
            <Text style={mStyles.close_btn_txt}>Close</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const mStyles = StyleSheet.create({
  overlay     : { position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(0,0,0,0.5)" },
  sheet       : {
    position:"absolute",
    top:0,
    left:0,
    right:0,
    backgroundColor:"#fff",
    borderBottomLeftRadius:24,
    borderBottomRightRadius:24,
    maxHeight:"90%",
    flexDirection:"column",
    paddingTop: ((Platform.OS === 'ios' ? 44 : StatusBar.currentHeight) || 30) + 10,
    elevation:8,
    shadowColor:"#000",
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.15,
    shadowRadius:8,
  },
  handle      : { width:40, height:4, backgroundColor:"#d1d5db", borderRadius:2, alignSelf:"center", marginTop:10, marginBottom:4 },
  header      : { flexDirection:"row", alignItems:"center", paddingHorizontal:20, paddingVertical:14, borderBottomWidth:1, borderBottomColor:"#f3f4f6", gap:10 },
  header_icon : { width:34, height:34, borderRadius:17, backgroundColor:"#F0F4FF", alignItems:"center", justifyContent:"center" },
  header_title: { fontSize:16, fontWeight:"700", color:"#111827", flex:1 },
  banner      : { backgroundColor:"#f9fafb", borderColor:"#e5e7eb", borderWidth:1, borderRadius:12, padding:14, marginBottom:14, gap:8 },
  banner_row  : { flexDirection:"row", justifyContent:"space-between", alignItems:"center" },
  banner_lbl  : { fontSize:12, color:"#9ca3af" },
  banner_id   : { fontSize:13, fontWeight:"700", color:"#111827", fontFamily:Platform.OS === "ios" ? "Courier" : "monospace" },
  status_pill : { paddingHorizontal:10, paddingVertical:3, borderRadius:20 },
  status_pill_txt: { fontSize:12, fontWeight:"600", color:"#374151" },
  summary     : { backgroundColor:"#F0F4FF", borderColor:"#bbf7d0", borderWidth:1, borderRadius:12, padding:14, marginBottom:14 },
  summary_heading: { fontSize:13, fontWeight:"700", color:colors.deep_blue, marginBottom:10 },
  summary_row : { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:4 },
  gst_row     : { flexDirection:"row", gap:6, marginBottom:8 },
  s_lbl       : { fontSize:13, color:"#6b7280" },
  s_val       : { fontSize:17, fontWeight:"800", color:"#16a34a" },
  gst_sub     : { fontSize:10, color:"#9ca3af" },
  summary_div : { height:1, backgroundColor:"#d1fae5", marginVertical:8 },
  info_row    : { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:7, borderBottomWidth:1, borderBottomColor:"#f9fafb" },
  info_lbl    : { fontSize:12, color:"#9ca3af" },
  info_val    : { fontSize:12, fontWeight:"600", color:"#111827", flex:1, textAlign:"right" },
  divider     : { height:1, backgroundColor:"#f3f4f6", marginVertical:14 },
  card        : { borderWidth:1, borderColor:"#bfdbfe", borderRadius:12, padding:14, marginBottom:14, backgroundColor:"#f8faff" },
  card_hdr    : { flexDirection:"row", alignItems:"center", marginBottom:10 },
  card_title  : { fontSize:14, fontWeight:"700", color:"#1e40af" },
  card_sub    : { fontSize:10, color:"#6b7280", marginTop:2 },
  gst_badge   : { backgroundColor:"#dbeafe", paddingHorizontal:7, paddingVertical:2, borderRadius:6 },
  gst_badge_txt: { fontSize:9, color:"#1e40af", fontWeight:"700" },
  btn_row     : { flexDirection:"row", gap:8 },
  action_btn  : { flexDirection:"row", alignItems:"center", justifyContent:"center", gap:6, paddingVertical:11, borderRadius:9 },
  btn_txt     : { color:"#fff", fontSize:12, fontWeight:"700" },
  footer_note : { fontSize:11, color:"#9ca3af", textAlign:"center", marginBottom:8 },
  footer      : { paddingHorizontal:20, paddingVertical:14, borderTopWidth:1, borderTopColor:"#f3f4f6" },
  close_btn   : { backgroundColor:"#f3f4f6", paddingVertical:13, borderRadius:12, alignItems:"center" },
  close_btn_txt: { fontSize:15, fontWeight:"600", color:"#374151" },
});

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
const { width, height } = Dimensions.get("window");

const UpcomingBookings = () => {
  const [showButton, setShowButton]           = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filtered, setFiltered]               = useState("all");
  const [loading, setLoading]                 = useState(false);
  const [bookingDetails, setBookingDetails]   = useState([]);
  const [refreshing, setRefreshing]           = useState(false);
  const [billModal, setBillModal]             = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const navigation = useNavigation();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const filterSlideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (filterModalVisible) {
      setShowFilterModal(true);
      Animated.timing(filterSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(filterSlideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowFilterModal(false);
      });
    }
  }, [filterModalVisible]);

  useFocusEffect(React.useCallback(() => { getBookings(); }, []));

  const onRefresh = async () => { setRefreshing(true); await getBookings(); setRefreshing(false); };

  const getBookings = async () => {
    try {
      setLoading(true);
      const vendor     = await AsyncStorage.getItem("user");
      const vendorData = JSON.parse(vendor);
      const vendorId   = vendorData._id;

      const res = await AxiosService.get(`vendor/getBookingsByVendorId/${vendorId}`);
      const data = res.data.bookings;
      const filteredData = data.filter(
        (item) =>
          (item.vendorApprovedStatus === "approved" || 
           item.vendorApprovedStatus === "pending" || 
           item.vendorApprovedStatus === "advance_pending") &&
          item.tripStatus !== "completed" &&
          item.tripStatus !== "cancelled"
      );
      if (res.status === 200) {
        setBookingDetails(filteredData);
        console.log("Bookings fetched successfully");
      }
    } catch (error) {
      console.error(error.response ? error.response.data.error : error.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  const filteredData = filtered === "all"
    ? bookingDetails
    : filtered === "pending"
      ? bookingDetails.filter((book) => book.vendorApprovedStatus === "pending" || book.vendorApprovedStatus === "advance_pending")
      : bookingDetails.filter((book) => book.vendorApprovedStatus === filtered);

  const toggleFilter = (filter) => { setFiltered(filter); setFilterModalVisible(false); };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":         return colors.orange;
      case "advance_pending": return colors.orange;
      case "approved":        return colors.green;
      case "ongoing":         return colors.blue;
      case "completed":       return colors.deep_blue;
      case "cancelled":       return colors.red;
      default:          return colors.gray;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":         return "timer-sand";
      case "advance_pending": return "clock-outline";
      case "approved":        return "check-circle";
      case "ongoing":         return "progress-clock";
      default:          return "information";
    }
  };

  const getTripStatusColor = (status) => {
    switch (status) {
      case "start":     return colors.orange;
      case "ongoing":   return colors.blue;
      case "completed": return colors.green;
      default:          return colors.dark_gray;
    }
  };

  const getVehicleImage = (subCategory, goodsType) => {
    const map = {
      car: carImg, auto: autoImg, van: vanImg, bus: busImg,
      truck: { Small: smallTruckImg, Medium: mediumTruckImg, Large: largeTruckImg, XL: XLTruckImg },
    };
    if (subCategory === "truck" && goodsType) return map.truck[goodsType] || XLTruckImg;
    return map[subCategory] || carImg;
  };

  const getVehicleIcon = (subCategory) => {
    switch (subCategory) {
      case "bus":   return "bus";
      default:      return "car";
    }
  };

  const getCountByStatus = (status) => {
    if (status === "pending") {
      return bookingDetails.filter((b) => b.vendorApprovedStatus === "pending" || b.vendorApprovedStatus === "advance_pending").length;
    }
    return bookingDetails.filter((b) => b.vendorApprovedStatus === status).length;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.deep_blue} />
          <Text style={styles.loadingText}>Loading your bookings...</Text>
        </View>
      </View>
    );
  }

  if (bookingDetails.length === 0) {
    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[colors.deep_blue]} tintColor={colors.deep_blue} />
        }
        contentContainerStyle={styles.no_data_main_container}
      >
        <View style={styles.noDataCard}>
          <View style={styles.noDataIconContainer}>
            <Icon2 name="calendar-blank" size={hp("6%")} color={colors.deep_blue} />
          </View>
          <Text style={styles.main_txt}>No Upcoming Bookings</Text>
          <Text style={styles.sub_txt}>
            You don't have any upcoming bookings at the moment
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon4 name="refresh" size={wp("4%")} color={colors.white} />
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.deep_blue} barStyle="light-content" />

      {/* Header with Stats */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Upcoming Bookings</Text>
            <View style={styles.headerBadge}>
              <Icon4 name="calendar" size={wp("3.5%")} color={colors.white} />
              <Text style={styles.headerBadgeText}>{filteredData.length} Active</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.filterIconButton}
            onPress={() => setFilterModalVisible(true)}>
            <Icon4 name="options-outline" size={wp("5%")} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Pressable style={[styles.statCard, filtered === "all" && styles.activeStatCard]}
            onPress={() => setFiltered("all")}>
            <Icon4 name="apps-outline" size={wp("5%")} color={colors.white} />
            <Text style={styles.statNumber}>{bookingDetails.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </Pressable>
          <Pressable style={[styles.statCard, filtered === "pending" && styles.activeStatCard]}
            onPress={() => setFiltered("pending")}>
            <Icon2 name="timer-sand" size={wp("5%")} color={colors.white} />
            <Text style={styles.statNumber}>{getCountByStatus("pending")}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Pressable>
          <Pressable style={[styles.statCard, filtered === "approved" && styles.activeStatCard]}
            onPress={() => setFiltered("approved")}>
            <Icon4 name="checkmark-circle-outline" size={wp("5%")} color={colors.white} />
            <Text style={styles.statNumber}>{getCountByStatus("approved")}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </Pressable>
        </View>

        {/* Active filter indicator */}
        {filtered !== "all" ? (
          <View style={styles.activeFilterContainer}>
            <Text style={styles.activeFilterText}>
              Showing: <Text style={styles.activeFilterValue}>{filtered} bookings</Text>
            </Text>
            <Pressable onPress={() => setFiltered("all")}>
              <Icon5 name="close" size={wp("3.5%")} color={colors.white} />
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)} />
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{
                translateY: filterSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-height, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Bookings</Text>
            <Pressable onPress={() => setFilterModalVisible(false)}>
              <Icon5 name="close" size={wp("5%")} color={colors.dark_gray} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.filterSectionTitle}>Booking Status</Text>

            {[
              { value: "all",             label: "All Bookings",     icon: "apps-outline",              iconLib: "Ion", color: colors.deep_blue },
              { value: "pending",         label: "Pending",          icon: "timer-sand",                iconLib: "Mat", color: colors.orange },
              { value: "advance_pending", label: "Advance Pending",  icon: "clock-outline",             iconLib: "Mat", color: colors.orange },
              { value: "approved",        label: "Approved",         icon: "checkmark-circle-outline",  iconLib: "Ion", color: colors.green  },
            ].map((opt) => (
              <Pressable key={opt.value}
                style={[styles.modalFilterOption, filtered === opt.value && styles.modalFilterOptionActive]}
                onPress={() => toggleFilter(opt.value)}>
                <View style={styles.filterOptionLeft}>
                  <View style={[styles.filterIconContainer, { backgroundColor: opt.color + "20" }]}>
                    {opt.iconLib === "Ion"
                      ? <Icon4 name={opt.icon} size={wp("4.5%")} color={opt.color} />
                      : <Icon2 name={opt.icon} size={wp("4.5%")} color={opt.color} />}
                  </View>
                  <View>
                    <Text style={styles.modalFilterText}>{opt.label}</Text>
                    <Text style={styles.modalFilterCount}>
                      {opt.value === "all" ? bookingDetails.length : getCountByStatus(opt.value)} bookings
                    </Text>
                  </View>
                </View>
                {filtered === opt.value ? (
                  <Icon4 name="checkmark-circle" size={wp("4%")} color={colors.deep_blue} />
                ) : null}
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.modalApplyButton} onPress={() => setFilterModalVisible(false)}>
            <Text style={styles.modalApplyText}>Apply Filter</Text>
          </Pressable>
        </Animated.View>
      </Modal>

      {/* Booking List */}
      {filteredData.length === 0 ? (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[colors.deep_blue]} tintColor={colors.deep_blue} />}
          contentContainerStyle={styles.noFilterDataContainer}
        >
          <View style={styles.noDataCard}>
            <Icon2 name="filter-off" size={hp("6%")} color={colors.dark_gray} />
            <Text style={styles.noFilterTitle}>No {filtered} bookings</Text>
            <Text style={styles.noFilterSubtitle}>Try changing your filter or refresh</Text>
            <Pressable style={styles.clearFilterButton} onPress={() => setFiltered("all")}>
              <Text style={styles.clearFilterText}>Show All</Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            colors={[colors.deep_blue]} tintColor={colors.deep_blue} />}
          showsVerticalScrollIndicator={false}
          data={[...filteredData].reverse()}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => {
            const vehicleSubCategory = item?.vehicleDetails?.foundVehicle?.subCategory;
            const goodsType          = item?.vehicleDetails?.foundVehicle?.goodsType;

            return (
              <Pressable
                style={styles.bookingCard}
                onPress={() => navigation.navigate("AutoBookingDetails", { bookingDetails: item })}
              >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.customerInfo}>
                    <View style={styles.avatarContainer}>
                      <Image source={require("../../assets/Images/user.png")} style={styles.avatar} />
                      <View style={[styles.onlineIndicator, {
                        backgroundColor: item.vendorApprovedStatus === "approved" ? colors.green : colors.orange,
                      }]} />
                    </View>
                    <View>
                      <Text style={styles.customerName}>{item.customer.customerName}</Text>
                      <View style={styles.dateContainer}>
                        <Icon4 name="calendar-outline" size={wp("2.8%")} color={colors.dark_gray} />
                        <Text style={styles.dateText}>{fmtDate(item.bookedAt)}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge,
                      { backgroundColor: getStatusColor(item.vendorApprovedStatus) + "20" }]}>
                      <Icon2 name={getStatusIcon(item.vendorApprovedStatus)}
                        size={wp("3%")} color={getStatusColor(item.vendorApprovedStatus)} />
                      <Text style={[styles.statusText, { color: getStatusColor(item.vendorApprovedStatus) }]}>
                        {item.vendorApprovedStatus}
                      </Text>
                    </View>
                    <Text style={styles.bookingId}>
                      #{String(item._id).slice(-6).toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Vehicle Info */}
                <View style={styles.vehicleInfoContainer}>
                  <View style={styles.vehicleDetails}>
                    <View style={styles.vehicleDetailRow}>
                      <Icon4 name={getVehicleIcon(vehicleSubCategory)}
                        size={wp("3.5%")} color={colors.deep_blue} />
                      <Text style={styles.vehicleLabel}>Vehicle:</Text>
                      <Text style={styles.vehicleValue}>
                        {item?.vehicleDetails?.foundVehicle?.licensePlate || "—"}
                      </Text>
                    </View>
                    <View style={styles.vehicleDetailRow}>
                      <Icon4 name="time-outline" size={wp("3.5%")} color={colors.deep_blue} />
                      <Text style={styles.vehicleLabel}>Pickup:</Text>
                      <Text style={styles.vehicleValue}>{fmtDate(item.pickupDate)}</Text>
                    </View>
                    <View style={styles.vehicleDetailRow}>
                      <Icon4 name="pricetag-outline" size={wp("3.5%")} color={colors.deep_blue} />
                      <Text style={styles.vehicleLabel}>Type:</Text>
                      <Text style={styles.vehicleValue}>
                        {(vehicleSubCategory?.charAt(0)?.toUpperCase() + vehicleSubCategory?.slice(1)) || "Vehicle"}
                        {goodsType ? " (" + goodsType + ")" : ""}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.vehicleImageContainer}>
                    <Image source={getVehicleImage(vehicleSubCategory, goodsType)} style={styles.vehicleImage} />
                  </View>
                </View>

                {/* Locations */}
                <View style={styles.locationsContainer}>
                  <View style={styles.locationRow}>
                    <View style={[styles.locationDot, { backgroundColor: colors.green }]} />
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationLabel}>FROM</Text>
                      <Text style={styles.locationAddress} numberOfLines={1}>{item.pickupLocation}</Text>
                    </View>
                  </View>
                  <View style={styles.locationProgress}>
                    <View style={styles.progressLine} />
                    <View style={styles.progressIcon}>
                      <Icon5 name="arrow-down" size={wp("3%")} color={colors.deep_blue} />
                    </View>
                    <View style={styles.progressLine} />
                  </View>
                  <View style={styles.locationRow}>
                    <View style={[styles.locationDot, { backgroundColor: colors.red }]} />
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationLabel}>TO</Text>
                      <Text style={styles.locationAddress} numberOfLines={1}>{item.dropLocation}</Text>
                    </View>
                  </View>
                </View>

                {/* Trip Status — approved only */}
                {item.vendorApprovedStatus === "approved" ? (
                  <View style={styles.tripStatusContainer}>
                    <View style={styles.tripStatusLeft}>
                      <Icon4 name="information-circle-outline" size={wp("4%")} color={colors.deep_blue} />
                      <Text style={styles.tripStatusLabel}>Trip Status:</Text>
                    </View>
                    <View style={[styles.tripStatusBadge,
                      { backgroundColor: getTripStatusColor(item.tripStatus) + "20" }]}>
                      <Text style={[styles.tripStatusValue,
                        { color: getTripStatusColor(item.tripStatus) }]}>
                        {item.tripStatus === "start" ? "Yet to start" : item.tripStatus}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.light_gray }}>
                  {/* Invoice button */}
                  <TouchableOpacity
                    style={styles.textLink}
                    onPress={() => { setSelectedBooking(item); setBillModal(true); }}
                  >
                    <Icon3 name="file-invoice" size={14} color={colors.deep_blue} />
                    <Text style={styles.textLinkLabel}>Invoice / PDF</Text>
                  </TouchableOpacity>

                  {/* Cancel button - only if pending or approved but not yet ongoing/completed */}
                  {(item.vendorApprovedStatus === "pending" || 
                    (item.vendorApprovedStatus === "approved" && item.tripStatus === "start")) && (
                    <TouchableOpacity
                      style={styles.textLink}
                      onPress={() => navigation.navigate("AutoBookingDetails", { bookingDetails: item })}
                    >
                      <Icon2 name="cancel" size={16} color={colors.red} />
                      <Text style={[styles.textLinkLabel, { color: colors.red }]}>Cancel Ride</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Pressable>
            );
          }}
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

export default UpcomingBookings;

const styles = StyleSheet.create({
  container           : { flex:1, backgroundColor:"#F5F7FA" },
  loadingContainer    : { flex:1, backgroundColor:colors.white, justifyContent:"center", alignItems:"center" },
  loadingContent      : { alignItems:"center" },
  loadingText         : { marginTop:hp("1.5%"), fontSize:wp("4%"), fontWeight:"500", color:colors.deep_blue },
  header              : { backgroundColor:colors.deep_blue, paddingTop:StatusBar.currentHeight || hp("5%"), paddingBottom:hp("2%"), borderBottomLeftRadius:wp("6%"), borderBottomRightRadius:wp("6%"), elevation:8, shadowColor:colors.black, shadowOffset:{width:0,height:4}, shadowOpacity:0.2, shadowRadius:8 },
  headerTopRow        : { flexDirection:"row", alignItems:"center", justifyContent:"space-between", paddingHorizontal:wp("4%"), marginBottom:hp("2%") },
  headerTitleContainer: { alignItems:"center" },
  headerTitle         : { fontSize:wp("6%"), fontWeight:"700", color:colors.white, letterSpacing:0.5, marginBottom:hp("0.5%") },
  headerBadge         : { flexDirection:"row", alignItems:"center", backgroundColor:"rgba(255,255,255,0.2)", paddingHorizontal:wp("3%"), paddingVertical:hp("0.3%"), borderRadius:wp("5%"), gap:wp("1%") },
  headerBadgeText     : { fontSize:wp("3%"), color:colors.white, fontWeight:"500" },
  filterIconButton    : { width:wp("10%"), height:wp("10%"), borderRadius:wp("5%"), backgroundColor:"rgba(255,255,255,0.2)", alignItems:"center", justifyContent:"center" },
  statsContainer      : { flexDirection:"row", justifyContent:"space-around", paddingHorizontal:wp("2%"), marginBottom:hp("1%") },
  statCard            : { backgroundColor:"rgba(255,255,255,0.15)", borderRadius:wp("4%"), padding:wp("3%"), alignItems:"center", width:wp("28%") },
  activeStatCard      : { backgroundColor:"rgba(255,255,255,0.3)", borderWidth:1, borderColor:colors.white },
  statNumber          : { fontSize:wp("5%"), fontWeight:"700", color:colors.white, marginTop:hp("0.5%") },
  statLabel           : { fontSize:wp("3%"), color:"rgba(255,255,255,0.8)", marginTop:hp("0.2%") },
  activeFilterContainer: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:"rgba(255,255,255,0.2)", marginHorizontal:wp("4%"), marginTop:hp("1%"), paddingHorizontal:wp("3%"), paddingVertical:hp("0.5%"), borderRadius:wp("5%") },
  activeFilterText    : { fontSize:wp("3.2%"), color:colors.white },
  activeFilterValue   : { fontWeight:"700", textTransform:"capitalize" },
  modalOverlay        : { position:"absolute", top:0, left:0, right:0, bottom:0, backgroundColor:"rgba(0,0,0,0.5)" },
  modalContent        : {
    position:"absolute",
    top:0,
    left:0,
    right:0,
    backgroundColor:colors.white,
    borderBottomLeftRadius:wp("8%"),
    borderBottomRightRadius:wp("8%"),
    padding:wp("5%"),
    maxHeight:hp("70%"),
    paddingTop: ((Platform.OS === 'ios' ? 44 : StatusBar.currentHeight) || 30) + wp("5%"),
    elevation:8,
    shadowColor:"#000",
    shadowOffset:{width:0,height:4},
    shadowOpacity:0.15,
    shadowRadius:8,
  },
  modalHeader         : { flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:hp("2%"), paddingBottom:hp("1%"), borderBottomWidth:1, borderBottomColor:colors.light_gray },
  modalTitle          : { fontSize:wp("5%"), fontWeight:"700", color:colors.black },
  modalBody           : { marginBottom:hp("2%") },
  filterSectionTitle  : { fontSize:wp("3.5%"), fontWeight:"600", color:colors.dark_gray, marginBottom:hp("1.5%") },
  modalFilterOption   : { flexDirection:"row", alignItems:"center", justifyContent:"space-between", padding:wp("3%"), borderRadius:wp("3%"), marginBottom:hp("1%"), backgroundColor:colors.light_gray + "30" },
  modalFilterOptionActive: { backgroundColor:colors.deep_blue + "10", borderWidth:1, borderColor:colors.deep_blue },
  filterOptionLeft    : { flexDirection:"row", alignItems:"center", gap:wp("3%") },
  filterIconContainer : { width:wp("10%"), height:wp("10%"), borderRadius:wp("5%"), alignItems:"center", justifyContent:"center" },
  modalFilterText     : { fontSize:wp("3.8%"), fontWeight:"600", color:colors.black, marginBottom:hp("0.2%") },
  modalFilterCount    : { fontSize:wp("3%"), color:colors.dark_gray },
  modalApplyButton    : { backgroundColor:colors.deep_blue, padding:hp("1.5%"), borderRadius:wp("3%"), alignItems:"center" },
  modalApplyText      : { fontSize:wp("4%"), fontWeight:"600", color:colors.white },
  listContainer       : { padding:wp("4%") },
  bookingCard         : { backgroundColor:colors.white, borderRadius:wp("5%"), padding:wp("4%"), marginBottom:hp("2%"), elevation:4, shadowColor:colors.black, shadowOffset:{width:0,height:2}, shadowOpacity:0.1, shadowRadius:6, borderWidth:1, borderColor:"rgba(0,0,0,0.03)" },
  cardHeader          : { flexDirection:"row", justifyContent:"space-between", alignItems:"flex-start", marginBottom:hp("1.5%") },
  customerInfo        : { flexDirection:"row", alignItems:"center", gap:wp("3%") },
  avatarContainer     : { position:"relative" },
  avatar              : { width:wp("12%"), height:wp("12%"), borderRadius:wp("6%") },
  onlineIndicator     : { position:"absolute", bottom:0, right:0, width:wp("2.5%"), height:wp("2.5%"), borderRadius:wp("1.25%"), borderWidth:2, borderColor:colors.white },
  customerName        : { fontSize:wp("4%"), fontWeight:"600", color:colors.black, marginBottom:hp("0.3%") },
  dateContainer       : { flexDirection:"row", alignItems:"center", gap:wp("1%") },
  dateText            : { fontSize:wp("3%"), color:colors.dark_gray },
  statusContainer     : { alignItems:"flex-end" },
  statusBadge         : { flexDirection:"row", alignItems:"center", paddingHorizontal:wp("2%"), paddingVertical:hp("0.5%"), borderRadius:wp("3%"), gap:wp("1%"), marginBottom:hp("0.3%") },
  statusText          : { fontSize:wp("2.8%"), fontWeight:"600", textTransform:"capitalize" },
  bookingId           : { fontSize:wp("2.5%"), color:colors.dark_gray },
  vehicleInfoContainer: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", backgroundColor:colors.light_gray + "40", padding:wp("3%"), borderRadius:wp("4%"), marginBottom:hp("1.5%") },
  vehicleDetails      : { flex:1, gap:hp("0.8%") },
  vehicleDetailRow    : { flexDirection:"row", alignItems:"center", gap:wp("2%") },
  vehicleLabel        : { fontSize:wp("3.2%"), fontWeight:"500", color:colors.dark_gray, width:wp("15%") },
  vehicleValue        : { fontSize:wp("3.2%"), fontWeight:"600", color:colors.black, flex:1 },
  vehicleImageContainer: { width:wp("18%"), height:wp("18%"), borderRadius:wp("4%"), backgroundColor:"#F0F4FF", alignItems:"center", justifyContent:"center" },
  vehicleImage        : { width:wp("15%"), height:wp("15%"), resizeMode:"contain" },
  locationsContainer  : { marginBottom:hp("1.5%") },
  locationRow         : { flexDirection:"row", alignItems:"flex-start", gap:wp("3%") },
  locationDot         : { width:wp("2%"), height:wp("2%"), borderRadius:wp("1%"), marginTop:hp("0.5%") },
  locationTextContainer: { flex:1 },
  locationLabel       : { fontSize:wp("2.5%"), fontWeight:"700", color:colors.dark_gray, letterSpacing:0.5, marginBottom:hp("0.2%") },
  locationAddress     : { fontSize:wp("3.2%"), fontWeight:"500", color:colors.black },
  locationProgress    : { flexDirection:"row", alignItems:"center", paddingLeft:wp("3.5%"), marginVertical:hp("0.5%"), gap:wp("2%") },
  progressLine        : { flex:1, height:1, backgroundColor:colors.gray + "80" },
  progressIcon        : { width:wp("5%"), height:wp("5%"), borderRadius:wp("2.5%"), backgroundColor:"#F0F4FF", alignItems:"center", justifyContent:"center" },
  tripStatusContainer : { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingTop:hp("1.5%"), borderTopWidth:1, borderTopColor:colors.light_gray },
  tripStatusLeft      : { flexDirection:"row", alignItems:"center", gap:wp("1.5%") },
  tripStatusLabel     : { fontSize:wp("3.2%"), fontWeight:"500", color:colors.dark_gray },
  tripStatusBadge     : { paddingHorizontal:wp("3%"), paddingVertical:hp("0.5%"), borderRadius:wp("3%") },
  tripStatusValue     : { fontSize:wp("3%"), fontWeight:"600", textTransform:"capitalize" },
  no_data_main_container: { flexGrow:1, justifyContent:"center", alignItems:"center", backgroundColor:"#F5F7FA", padding:wp("5%") },
  noDataCard          : { backgroundColor:colors.white, borderRadius:wp("8%"), padding:wp("8%"), alignItems:"center", width:"100%", elevation:4, shadowColor:colors.black, shadowOffset:{width:0,height:4}, shadowOpacity:0.1, shadowRadius:8 },
  noDataIconContainer : { width:wp("25%"), height:wp("25%"), borderRadius:wp("12.5%"), backgroundColor:"#F0F4FF", alignItems:"center", justifyContent:"center", marginBottom:hp("2.5%") },
  main_txt            : { fontSize:wp("6%"), fontWeight:"700", color:colors.deep_blue, marginBottom:hp("1%") },
  sub_txt             : { fontSize:wp("3.5%"), color:colors.dark_gray, textAlign:"center", marginBottom:hp("2.5%"), lineHeight:hp("2.5%"), paddingHorizontal:wp("5%") },
  refreshButton       : { backgroundColor:colors.deep_blue, flexDirection:"row", alignItems:"center", gap:wp("2%"), paddingHorizontal:wp("6%"), paddingVertical:hp("1.5%"), borderRadius:wp("6%") },
  refreshButtonText   : { fontSize:wp("3.5%"), fontWeight:"600", color:colors.white },
  noFilterDataContainer: { flexGrow:1, justifyContent:"center", alignItems:"center", padding:wp("5%") },
  noFilterTitle       : { fontSize:wp("4.5%"), fontWeight:"600", color:colors.black, marginTop:hp("1.5%"), marginBottom:hp("0.5%"), textTransform:"capitalize" },
  noFilterSubtitle    : { fontSize:wp("3.5%"), color:colors.dark_gray, textAlign:"center", marginBottom:hp("2%") },
  clearFilterButton   : { paddingHorizontal:wp("5%"), paddingVertical:hp("1%"), borderRadius:wp("5%"), borderWidth:1, borderColor:colors.deep_blue },
  clearFilterText     : { fontSize:wp("3.5%"), fontWeight:"600", color:colors.deep_blue },
  textLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  textLinkLabel: {
    fontSize: wp("3.5%"),
    fontWeight: '600',
    color: colors.deep_blue,
  },
  invoiceBtn       : { flexDirection:"row", alignItems:"center", gap:wp("2%"), paddingVertical:hp("1%"), paddingHorizontal:wp("4%"), borderRadius:wp("3%"), borderWidth:1, borderColor:colors.deep_blue, backgroundColor:"#F0F4FF" },
  invoiceBtnTxt    : { fontSize:wp("3.2%"), fontWeight:"600", color:colors.deep_blue },
});