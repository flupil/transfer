import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { workoutLogoSvgs } from '../assets/workoutLogoStrings';

interface WorkoutLogoProps {
  workoutName: string;
  size?: number;
}

const WorkoutLogo: React.FC<WorkoutLogoProps> = ({ workoutName, size = 40 }) => {
  const getWorkoutSvg = (name: string): string => {
    const nameLower = name.toLowerCase();

    if (nameLower.includes('chest') && nameLower.includes('tricep')) return workoutLogoSvgs['chest day'];
    if (nameLower.includes('push')) return workoutLogoSvgs['push day'];
    if (nameLower.includes('back') && nameLower.includes('bicep')) return workoutLogoSvgs['back day'];
    if (nameLower.includes('pull')) return workoutLogoSvgs['pull day'];
    if (nameLower.includes('leg')) return workoutLogoSvgs['leg day'];
    if (nameLower.includes('shoulder') && nameLower.includes('ab')) return workoutLogoSvgs['shoulder and abs day'];
    if (nameLower.includes('shoulder')) return workoutLogoSvgs['shoulder and abs day'];
    if (nameLower.includes('abs') || nameLower.includes('core')) return workoutLogoSvgs['abs day'];
    if (nameLower.includes('arm') || nameLower.includes('bicep') || nameLower.includes('tricep')) return workoutLogoSvgs['arms day'];
    if (nameLower.includes('full body') || nameLower.includes('total')) return workoutLogoSvgs['full body day'];
    if (nameLower.includes('rest') || nameLower.includes('recovery')) return workoutLogoSvgs['rest day'];

    // Default to full body if no match
    return workoutLogoSvgs['default'] || workoutLogoSvgs['full body day'];
  };

  const svgString = getWorkoutSvg(workoutName);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <SvgXml
        xml={svgString}
        width={size}
        height={size}
      />
    </View>
  );
};

export default WorkoutLogo;