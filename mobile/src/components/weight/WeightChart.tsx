import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { colors } from '../../constants/colors';
import { fonts, spacing } from '../../constants/typography';
import { WeightLog } from '../../types';
import { formatShortDate } from '../../utils/dateHelpers';

interface WeightChartProps {
  logs: WeightLog[];
}

const CHART_HEIGHT = 160;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Screen padding (24*2) + card padding (20*2) + y-axis label column (~36).
const CHART_WIDTH = SCREEN_WIDTH - 24 * 2 - 20 * 2 - 36;

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

  const linePath = sorted
    .map((l, i) => `${i === 0 ? 'M' : 'L'} ${pointX(i).toFixed(1)},${pointY(l.weightKg).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${pointX(sorted.length - 1).toFixed(1)},${CHART_HEIGHT} L ${pointX(0).toFixed(1)},${CHART_HEIGHT} Z`;

  return (
    <View style={styles.container}>
      <View style={styles.yLabels}>
        <Text style={styles.yLabel}>{maxW.toFixed(1)}</Text>
        <Text style={styles.yLabel}>{((maxW + minW) / 2).toFixed(1)}</Text>
        <Text style={styles.yLabel}>{minW.toFixed(1)}</Text>
      </View>
      <View>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <Defs>
            <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={colors.primary} stopOpacity={0.25} />
              <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Dashed horizontal grid */}
          {[0, 0.5, 1].map((frac) => (
            <Line
              key={frac}
              x1={0}
              y1={frac * CHART_HEIGHT}
              x2={CHART_WIDTH}
              y2={frac * CHART_HEIGHT}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          ))}

          <Path d={areaPath} fill="url(#weightFill)" />
          <Path
            d={linePath}
            stroke={colors.primary}
            strokeWidth={2.5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {sorted.map((log, i) => (
            <Circle
              key={log.id}
              cx={pointX(i)}
              cy={pointY(log.weightKg)}
              r={4}
              fill={colors.primary}
              stroke={colors.card}
              strokeWidth={1.5}
            />
          ))}
        </Svg>

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
  yLabel: { fontFamily: fonts.sans, fontSize: 10, color: colors.mutedForeground },
  xLabels: { position: 'relative', height: 20, width: CHART_WIDTH, marginTop: 4 },
  xLabel: { position: 'absolute', fontFamily: fonts.sans, fontSize: 10, color: colors.mutedForeground },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
});
