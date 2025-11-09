import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

interface RecommendedMacroPieChartProps {
  title?: string;
  goal: 'gain' | 'lose' | 'maintain';
  size?: number;
}

// Macro ratios by fitness goal
const MACRO_RATIOS = {
  gain: { carbs: 45, protein: 30, fat: 25 },        // Muscle Gain
  lose: { carbs: 40, protein: 35, fat: 25 },        // Fat Loss
  maintain: { carbs: 50, protein: 25, fat: 25 },    // Maintenance / General Fitness
};

const RecommendedMacroPieChart: React.FC<RecommendedMacroPieChartProps> = ({
  title,
  goal,
  size = 120,
}) => {
  const radius = size / 2;
  const center = size / 2;

  // Get ratios based on goal
  const ratios = MACRO_RATIOS[goal] || MACRO_RATIOS.maintain;
  const carbsPercent = ratios.carbs;
  const proteinPercent = ratios.protein;
  const fatPercent = ratios.fat;

  // Colors (matching your app theme)
  const colors = {
    carbs: '#4ECDC4',     // Teal/Cyan
    protein: '#E8C547',   // Yellow
    fat: '#FF9F40',       // Orange
  };

  // Helper function to create a pie slice path
  const createPieSlice = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  // Helper function to calculate label position
  const getLabelPosition = (startAngle: number, endAngle: number) => {
    const midAngle = (startAngle + endAngle) / 2;
    const midRad = (midAngle - 90) * Math.PI / 180;
    const labelRadius = radius * 0.60; // Position at 60% of radius for better centering

    return {
      x: center + labelRadius * Math.cos(midRad),
      y: center + labelRadius * Math.sin(midRad),
    };
  };

  // Calculate angles for each segment
  let currentAngle = 0;
  const carbsAngle = (carbsPercent / 100) * 360;
  const proteinAngle = (proteinPercent / 100) * 360;
  const fatAngle = (fatPercent / 100) * 360;

  const carbsPath = createPieSlice(currentAngle, currentAngle + carbsAngle);
  const carbsLabel = getLabelPosition(currentAngle, currentAngle + carbsAngle);
  currentAngle += carbsAngle;

  const proteinPath = createPieSlice(currentAngle, currentAngle + proteinAngle);
  const proteinLabel = getLabelPosition(currentAngle, currentAngle + proteinAngle);
  currentAngle += proteinAngle;

  const fatPath = createPieSlice(currentAngle, currentAngle + fatAngle);
  const fatLabel = getLabelPosition(currentAngle, currentAngle + fatAngle);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        <G>
          {/* Pie slices */}
          <Path
            d={carbsPath}
            fill={colors.carbs}
            stroke="#2C2C2E"
            strokeWidth="3"
          />
          <Path
            d={proteinPath}
            fill={colors.protein}
            stroke="#2C2C2E"
            strokeWidth="3"
          />
          <Path
            d={fatPath}
            fill={colors.fat}
            stroke="#2C2C2E"
            strokeWidth="3"
          />

          {/* Percentage labels */}
          {carbsPercent > 5 && (
            <SvgText
              x={carbsLabel.x}
              y={carbsLabel.y}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#000"
              dy="0.3em"
            >
              {carbsPercent}%
            </SvgText>
          )}
          {proteinPercent > 5 && (
            <SvgText
              x={proteinLabel.x}
              y={proteinLabel.y}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#000"
              dy="0.3em"
            >
              {proteinPercent}%
            </SvgText>
          )}
          {fatPercent > 5 && (
            <SvgText
              x={fatLabel.x}
              y={fatLabel.y}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#000"
              dy="0.3em"
            >
              {fatPercent}%
            </SvgText>
          )}
        </G>
      </Svg>

      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  title: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default RecommendedMacroPieChart;
