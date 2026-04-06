import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing, Typography } from '../../constants/theme';
import { Task } from '../../lib/api';

interface TaskCardProps {
  task: Task;
  currentUserId: string;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
  isHighlighted?: boolean;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TaskCard({
  task,
  onToggle,
  onDelete,
  isHighlighted = false,
}: TaskCardProps) {
  const colors = useThemeColors();
  const swipeableRef = useRef<Swipeable>(null);
  const isCompleted = !!task.completedAt;

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: colors.destructive }]}
      onPress={() => {
        swipeableRef.current?.close();
        onDelete(task.id);
      }}
      accessibilityLabel="Delete task"
    >
      <Text style={styles.deleteText}>Delete</Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      minHeight: 44,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      opacity: isCompleted ? 0.7 : 1,
      ...(isHighlighted
        ? { borderLeftWidth: 2, borderLeftColor: colors.accent }
        : {}),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkbox: {
      width: 44,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: -Spacing.sm,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    name: {
      ...Typography.body,
      color: isCompleted ? colors.textSecondary : colors.textPrimary,
      textDecorationLine: isCompleted ? 'line-through' : 'none',
    },
    meta: {
      ...Typography.label,
      color: colors.textSecondary,
      marginTop: 2,
    },
    deleteAction: {
      width: 80,
      justifyContent: 'center',
      alignItems: 'center',
    },
    deleteText: {
      color: '#FFFFFF',
      ...Typography.label,
      fontWeight: '600' as const,
    },
  });

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} friction={2}>
      <View style={styles.container}>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => onToggle(task.id, !isCompleted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isCompleted }}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={isCompleted ? colors.accent : colors.textSecondary}
            />
          </TouchableOpacity>
          <View style={styles.content}>
            <Text style={styles.name}>{task.name}</Text>
            <Text style={styles.meta}>
              Added by {task.addedByName} · {relativeTime(task.createdAt)}
            </Text>
            {isCompleted && task.completedByName ? (
              <Text style={styles.meta}>Done by {task.completedByName}</Text>
            ) : null}
          </View>
        </View>
      </View>
    </Swipeable>
  );
}
