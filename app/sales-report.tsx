import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { ArrowLeft, TrendingUp, Package, DollarSign, Download } from 'lucide-react';
import { useOrders } from '@/hooks/orders-store';
import { useAuth } from '@/hooks/auth-store';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

export default function SalesReportScreen() {
  const { dailySales, closeDailySales, startNewDay, resetDailySales } = useOrders();
  const { currentUser } = useAuth();
  const insets = useSafeAreaInsets();

  const handleStartDay = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'No hay usuario autenticado');
      return;
    }

    Alert.alert(
      'Iniciar Nuevo Día',
      '¿Deseas iniciar un nuevo día de ventas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar Día',
          onPress: async () => {
            const success = await startNewDay();
            if (success) {
              Alert.alert('Éxito', 'Nuevo día iniciado correctamente');
            } else {
              Alert.alert('Error', 'No se pudo iniciar el día');
            }
          }
        }
      ]
    );
  };

  const handleCloseDay = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'No hay usuario autenticado');
      return;
    }

    if (!dailySales) {
      Alert.alert('Error', 'No hay datos de ventas para cerrar');
      return;
    }

    if (dailySales.isClosed) {
      Alert.alert('Información', 'El día ya ha sido cerrado');
      return;
    }

    Alert.alert(
      'Finalizar Día',
      `¿Estás seguro de finalizar el día? Después de esto podrás ver el reporte completo.\n\nTotal del día: ${dailySales.totalRevenue} Bs.\nÓrdenes: ${dailySales.totalOrders}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Finalizar Día',
          style: 'destructive',
          onPress: async () => {
            const success = await closeDailySales(currentUser.username);
            if (success) {
              Alert.alert('Éxito', 'Día finalizado exitosamente. Ya puedes ver el reporte.');
            } else {
              Alert.alert('Error', 'No se pudo finalizar el día');
            }
          }
        }
      ]
    );
  };

  const handleResetDay = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'No hay usuario autenticado');
      return;
    }

    Alert.alert(
      'Reiniciar Día',
      '¡ADVERTENCIA! Esto eliminará todos los datos de ventas del día actual. Esta acción no se puede deshacer.\n\n¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reiniciar',
          style: 'destructive',
          onPress: async () => {
            await resetDailySales();
            Alert.alert('Éxito', 'Día reiniciado correctamente');
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const sortedItems = dailySales ? 
    Object.entries(dailySales.itemsSold)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
    : [];

  const handleExport = async () => {
    await exportToExcel();
  };

  const getUniqueFileName = (baseFileName: string): string => {
    if (Platform.OS === 'web') {
      return baseFileName;
    }

    const nameParts = baseFileName.split('.');
    const extension = nameParts.pop();
    const nameWithoutExt = nameParts.join('.');

    let file = new File(Paths.cache, baseFileName);
    
    if (!file.exists) {
      return baseFileName;
    }

    let counter = 1;
    let newFileName = `${nameWithoutExt} (${counter}).${extension}`;
    file = new File(Paths.cache, newFileName);

    while (file.exists) {
      counter++;
      newFileName = `${nameWithoutExt} (${counter}).${extension}`;
      file = new File(Paths.cache, newFileName);
    }

    return newFileName;
  };

  const exportToExcel = async () => {
    if (!dailySales) {
      Alert.alert('Sin Datos', 'No hay datos de ventas para exportar');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      const orderDetails = dailySales.orderDetails || [];

      const totalCash = orderDetails
        .filter(order => order.paymentMethod === 'cash')
        .reduce((sum, order) => sum + order.total, 0);
      
      const totalQR = orderDetails
        .filter(order => order.paymentMethod === 'qr')
        .reduce((sum, order) => sum + order.total, 0);

      const summaryData = [
        ['REPORTE DE VENTAS'],
        ['Fecha:', formatDate(dailySales.date)],
        [],
        ['RESUMEN DE INGRESOS'],
        ['Ingresos en Efectivo:', `${totalCash.toFixed(2)} Bs.`],
        ['Ingresos por QR:', `${totalQR.toFixed(2)} Bs.`],
        ['TOTAL GENERAL:', `${dailySales.totalRevenue.toFixed(2)} Bs.`],
        [],
        ['Total Órdenes:', dailySales.totalOrders.toString()],
        ['Promedio por Orden:', `${dailySales.totalOrders > 0 ? Math.round(dailySales.totalRevenue / dailySales.totalOrders) : 0} Bs.`],
        [],
        ['PRODUCTOS VENDIDOS'],
        ['Producto', 'Cantidad', 'Ingresos']
      ];

      sortedItems.forEach(([, itemData]) => {
        summaryData.push([itemData.name, itemData.quantity.toString(), `${itemData.revenue} Bs.`]);
      });

      summaryData.push([]);
      summaryData.push(['DETALLE DE ÓRDENES']);
      summaryData.push(['Número de Orden', 'Total', 'Método de Pago', 'Tipo de Orden', 'Venta Socio', 'Nombre Socio', 'Hora']);
      
      orderDetails.forEach(order => {
        const time = new Date(order.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const paymentMethod = order.paymentMethod === 'cash' ? 'Efectivo' : 'QR';
        const orderType = order.orderType === 'dine-in' ? 'Para Comer Aquí' : 'Para Llevar';
        const isMemberSale = order.isMemberSale ? 'Sí' : 'No';
        const memberName = order.memberName || '-';
        summaryData.push([
          `#${order.orderNumber}`,
          `${order.total} Bs.`,
          paymentMethod,
          orderType,
          isMemberSale,
          memberName,
          time
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(summaryData);

      const colWidths = [
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 }
      ];
      ws['!cols'] = colWidths;

      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;
          
          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          
          ws[cellAddress].s = {
            border: {
              top: { style: 'thin', color: { rgb: '000000' } },
              bottom: { style: 'thin', color: { rgb: '000000' } },
              left: { style: 'thin', color: { rgb: '000000' } },
              right: { style: 'thin', color: { rgb: '000000' } }
            },
            alignment: {
              vertical: 'center',
              horizontal: 'left'
            }
          };

          if (R === 0 || R === 3 || R === 11 || R === summaryData.findIndex(row => row[0] === 'DETALLE DE ÓRDENES')) {
            ws[cellAddress].s.font = { bold: true };
            ws[cellAddress].s.fill = { fgColor: { rgb: 'E3F2FD' } };
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Ventas');

      const baseFileName = `ventas_${dailySales.date}.xlsx`;

      if (Platform.OS === 'web') {
        XLSX.writeFile(wb, baseFileName);
        Alert.alert('Éxito', 'Reporte de ventas descargado');
      } else {
        const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        
        const fileName = getUniqueFileName(baseFileName);
        const file = new File(Paths.cache, fileName);
        
        console.log('Guardando archivo en:', file.uri);
        
        if (!file.exists) {
          file.create();
        }
        
        file.write(new Uint8Array(wbout));

        console.log('Archivo guardado exitosamente en:', file.uri);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          console.log('Intentando compartir archivo...');
          await Sharing.shareAsync(file.uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Compartir Reporte de Ventas',
            UTI: 'com.microsoft.excel.xlsx'
          });
          console.log('Archivo compartido exitosamente');
        } else {
          Alert.alert('Éxito', `Archivo guardado en: ${file.uri}`);
        }
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      Alert.alert('Error', `No se pudo exportar el archivo: ${error instanceof Error ? error.message : String(error)}`);
    }
  };



  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reporte de Ventas</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.exportButton} 
            onPress={handleExport}
          >
            <Download size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {dailySales ? (
          <>
            <View style={styles.dateSection}>
              <Text style={styles.dateText}>
                {formatDate(dailySales.date)}
              </Text>
              {dailySales.isClosed && dailySales.closedAt && (
                <View style={styles.closedBadge}>
                  <Text style={styles.closedBadgeText}>
                    Día Cerrado - {new Date(dailySales.closedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {dailySales.closedBy && (
                    <Text style={styles.closedByText}>Por: {dailySales.closedBy}</Text>
                  )}
                </View>
              )}
              {currentUser?.role === 'admin' && (
                <View style={styles.dayControlButtons}>
                  {!dailySales.isClosed && (
                    <>
                      <TouchableOpacity style={styles.closeDayButton} onPress={handleCloseDay}>
                        <Text style={styles.closeDayButtonText}>Finalizar Día</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.resetDayButton} onPress={handleResetDay}>
                        <Text style={styles.resetDayButtonText}>Reiniciar Día</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {dailySales.isClosed && (
                    <TouchableOpacity style={styles.startDayButton} onPress={handleStartDay}>
                      <Text style={styles.startDayButtonText}>Iniciar Nuevo Día</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.summaryCards}>
              <View style={styles.summaryCard}>
                <View style={styles.cardIcon}>
                  <DollarSign size={24} color="#4CAF50" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardValue}>{dailySales.totalRevenue} Bs.</Text>
                  <Text style={styles.cardLabel}>Ingresos Totales</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.cardIcon}>
                  <Package size={24} color="#2196F3" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardValue}>{dailySales.totalOrders}</Text>
                  <Text style={styles.cardLabel}>Órdenes Totales</Text>
                </View>
              </View>

              <View style={styles.summaryCard}>
                <View style={styles.cardIcon}>
                  <TrendingUp size={24} color="#FF9800" />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardValue}>
                    {dailySales.totalOrders > 0 ? 
                      Math.round(dailySales.totalRevenue / dailySales.totalOrders) : 0} Bs.
                  </Text>
                  <Text style={styles.cardLabel}>Promedio por Orden</Text>
                </View>
              </View>
            </View>

            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Productos Vendidos</Text>
              
              {sortedItems.length > 0 ? (
                sortedItems.map(([itemId, itemData]) => (
                  <View key={itemId} style={styles.itemCard}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{itemData.name}</Text>
                      <Text style={styles.itemQuantity}>
                        Cantidad: {itemData.quantity}
                      </Text>
                    </View>
                    <View style={styles.itemRevenue}>
                      <Text style={styles.itemRevenueText}>
                        {itemData.revenue} Bs.
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay productos vendidos hoy</Text>
                </View>
              )}
            </View>

            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Detalle de Órdenes</Text>
              
              {dailySales.orderDetails && dailySales.orderDetails.length > 0 ? (
                dailySales.orderDetails.map((order, index) => (
                  <View key={index} style={styles.orderDetailCard}>
                    <View style={styles.orderDetailHeader}>
                      <Text style={styles.orderNumber}>Orden #{order.orderNumber}</Text>
                      <Text style={styles.orderTotal}>{order.total} Bs.</Text>
                    </View>
                    <View style={styles.orderDetailInfo}>
                      <View style={styles.orderDetailRow}>
                        <Text style={styles.orderDetailLabel}>Pago:</Text>
                        <Text style={styles.orderDetailValue}>
                          {order.paymentMethod === 'cash' ? 'Efectivo' : 'QR'}
                        </Text>
                      </View>
                      <View style={styles.orderDetailRow}>
                        <Text style={styles.orderDetailLabel}>Tipo:</Text>
                        <Text style={styles.orderDetailValue}>
                          {order.orderType === 'dine-in' ? 'Para Comer Aquí' : 'Para Llevar'}
                        </Text>
                      </View>
                      {order.isMemberSale && (
                        <View style={styles.orderDetailRow}>
                          <Text style={styles.orderDetailLabel}>Socio:</Text>
                          <Text style={[styles.orderDetailValue, styles.memberBadge]}>
                            {order.memberName}
                          </Text>
                        </View>
                      )}
                      <View style={styles.orderDetailRow}>
                        <Text style={styles.orderDetailLabel}>Hora:</Text>
                        <Text style={styles.orderDetailValue}>
                          {new Date(order.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay órdenes registradas hoy</Text>
                </View>
              )}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Cargando datos de ventas...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#D32F2F',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  resetButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  dateSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  summaryCards: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
  },
  itemsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemRevenue: {
    alignItems: 'flex-end',
  },
  itemRevenueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  orderDetailCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
  },
  orderDetailInfo: {
    gap: 8,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  memberBadge: {
    color: '#4CAF50',
  },
  closedBadge: {
    marginTop: 12,
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closedBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
  closedByText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center' as const,
    marginTop: 4,
  },
  dayControlButtons: {
    marginTop: 16,
    gap: 8,
  },
  closeDayButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  closeDayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  startDayButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  startDayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resetDayButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
  },
  resetDayButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});