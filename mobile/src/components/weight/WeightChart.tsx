import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/typography';
import { WeightLog } from '../../types';
import { formatShortDate } from '../../utils/dateHelpers';

interface WeightChartProps {
  logs: WeightLog[];
}

const CHART_HEIGHT = 160;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - spacing.lg * 4;

export const WeightChart: React.FC<WeightChartProps> = ({ logs }) => {
  const sorted = [...logs].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt)).slice(-10);

  if (sorted.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Grafik için en az 2 kayıt gerekli</Text>
      </View>
    );
  }

  const weights = sorted.map((l) => l.weightKg);
  const minW = Math.min(...weights) - 0.2;
  const maxW = Math.max(...weights) + 0.2;
  const range = maxW - minW || 1;

  const pointX = (i: number) => (i / (sorted.length - 1)) * CHART_WIDTH;
  const pointY = (w: number) => CHART_HEIGHT - ((w - minW) / range) * CHART_HEIGHT;

  const pathD = sorted
    .map((l, i) => `${i === 0 ? 'M' : 'L'} ${pointX(i).toFixed(1)},${pointY(l.weightKg).toFixed(1)}`)
    .join(' ');

  return (
    <View style={styles.container}>
      <View style={styles.yLabels}>
        <Text style={styles.yLabel}>{maxW.toFixed(1)}</Text>
        <Text style={styles.yLabel}>{((maxW + minW) / 2).toFixed(1)}</Text>
        <Text style={styles.yLabel}>{minW.toFixed(1)}</Text>
      </View>
      <View>
        <View style={styles.chartArea}>
          {[0, 0.5, 1].map((frac) => (
            <View
              key={frac}
              style={[styles.gridLine, { top: frac * CHART_HEIGHT }]}
            />
          ))}
          {sorted.map((log, i) => (
            <View
              key={log.id}
              style={[
                styles.dot,
                {
                  left: pointX(i) - 5,
                  top: pointY(log.weightKg) - 5,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.xLabels}>
          {sorted.map((log, i) =>
            i % Math.ceil(sorted.length / 4) === 0 ? (
              <Text key={log.id} style={[styles.xLabel, { left: pointX(i) - 20 }]}>
                {formatShortDate(log.loggedAt)}
              </Text>
            ) : null
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start' },
  yLabels: {
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    paddingRight: spacing.sm,
    width: 36,
  },
  yLabel: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.textMuted },
  chartArea: {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  xLabels: { position: 'relative', height: 20, width: CHART_WIDTH },
  xLabel: { position: 'absolute', fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.textMuted },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.textMuted },
});
