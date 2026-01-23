import { StyleSheet } from 'react-native';
import { COLORS } from '@constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#101820',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 23,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    color: COLORS.card,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2A35',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2A3A45',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFF',
    paddingVertical: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#1A2A35',
    borderWidth: 1,
    borderColor: '#2A3A45',
  },
  chipActive: {
    backgroundColor: 'rgba(0,217,255,0.2)',
    borderColor: '#00D9FF',
  },
  chipText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#00D9FF',
  },
  sceneContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  sceneCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1A2A35',
    borderRadius: 15,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A3A45',
    position: 'relative',
  },
  sceneCardActive: {
    borderColor: '#00D9FF',
    backgroundColor: 'rgba(0,217,255,0.1)',
  },
  sceneIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0A1A23',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sceneIconContainerActive: {
    backgroundColor: 'rgba(0,217,255,0.2)',
  },
  sceneLabel: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
  },
  sceneCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00D9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#1A2A35',
    marginBottom: 30,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 40,
    padding: 16,
    minHeight: 72,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,255,170,0.4)',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
  },
  styleInputBorder: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 32,
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
});
