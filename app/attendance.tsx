import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Download, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/auth-store';

export default function AttendanceScreen() {
  const { getAllCheckIns, getTodayCheckIns } = useAuth();
  const insets = useSafeAreaInsets();
  const [showAllRecords, setShowAllRecords] = useState(false);

  const records = showAllRecords ? getAllCheckIns() : getTodayCheckIns();

  const exportToCSV = () => {
    if (records.length === 0) {
      Alert.alert('Sin Datos', 'No hay registros para exportar');
      return;
    }

    let csvContent = 'Usuario,Fecha,Hora,Latitud,Longitud\n';
    
    records.forEach(record => {
      const date = new Date(record.timestamp).toLocaleDateString('es-ES');
      const time = new Date(record.timestamp).toLocaleTimeString('es-ES');
      csvContent += `${record.username},${date},${time},${record.location.latitude},${record.location.longitude}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `asistencia_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Alert.alert('Éxito', 'Archivo CSV descargado');
  };

  const handleExport = () => {
    if (Platform.OS === 'web') {
      exportToCSV();
    } else {
      Alert.alert('Exportar', 'Exportación solo disponible en web');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registros de Asistencia</Text>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Download size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, !showAllRecords && styles.filterButtonActive]}
          onPress={() => setShowAllRecords(false)}
        >
          <Text style={[styles.filterText, !showAllRecords && styles.filterTextActive]}>
            Hoy
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, showAllRecords && styles.filterButtonActive]}
          onPress={() => setShowAllRecords(true)}
        >
          <Text style={[styles.filterText, showAllRecords && styles.filterTextActive]}>
            Todos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Calendar size={32} color="#9C27B0" />
          <Text style={styles.summaryValue}>{records.length}</Text>
          <Text style={styles.summaryLabel}>
            {showAllRecords ? 'Registros Totales' : 'Check-ins Hoy'}
          </Text>
        </View>

        <View style={styles.recordsList}>
          {records.length > 0 ? (
            records.map(record => (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View style={styles.recordNameContainer}>
                    <Text style={styles.recordName}>{record.username}</Text>
                    <View style={[
                      styles.typeBadge,
                      record.type === 'check-in' ? styles.checkInBadge : styles.checkOutBadge
                    ]}>
                      <Text style={styles.typeBadgeText}>
                        {record.type === 'check-in' ? '⬇️ Entrada' : '⬆️ Salida'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.recordTime}>
                    {new Date(record.timestamp).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <Text style={styles.recordDate}>
                  {new Date(record.timestamp).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                <Text style={styles.recordLocation}>
                  📍 {record.location.latitude.toFixed(6)}, {record.location.longitude.toFixed(6)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {showAllRecords 
                  ? 'No hay registros de asistencia' 
                  : 'No hay check-ins para hoy'}
              </Text>
            </View>
          )}
        </View>
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
    backgroundColor: '#9C27B0',
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
  exportButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  filterContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 8,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  filterButtonActive: {
    backgroundColor: '#9C27B0',
  },
  filterText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#9C27B0',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  recordsList: {
    marginBottom: 24,
  },
  recordCard: {
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
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  recordNameContainer: {
    flex: 1,
    gap: 6,
  },
  recordName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  checkInBadge: {
    backgroundColor: '#E8F5E9',
  },
  checkOutBadge: {
    backgroundColor: '#FFEBEE',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#333',
  },
  recordTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9C27B0',
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  recordLocation: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
