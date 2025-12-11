import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Text,
  Card,
  Button as PaperButton,
  Chip,
  FAB,
  Switch,
  Divider,
  Avatar,
  IconButton,
  ActivityIndicator,
  SegmentedButtons,
  Checkbox,
  RadioButton,
  ProgressBar,
  Badge,
  Snackbar,
  Dialog,
  Portal,
  List,
  useTheme,
} from 'react-native-paper';
import Button from '@components/Button/Button';
import TextInput from '@components/TextInput/TextInput';
import { styles } from './DemoScreen.styles';

const DemoScreen = () => {
  const theme = useTheme();

  // States
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [switchOn, setSwitchOn] = useState(false);
  const [checked, setChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('first');
  const [segmentValue, setSegmentValue] = useState('one');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [expandedList, setExpandedList] = useState(true);

  const renderFolderIcon = (props: any) => <List.Icon {...props} icon="folder" />;
  const renderChevronIcon = (props: any) => <List.Icon {...props} icon="chevron-right" />;
  const renderFileIcon = (props: any) => <List.Icon {...props} icon="file" />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          {/* Typography */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Typography
              </Text>
              <Text variant="displayLarge">Display Large</Text>
              <Text variant="displayMedium">Display Medium</Text>
              <Text variant="displaySmall">Display Small</Text>
              <Divider style={styles.miniDivider} />
              <Text variant="headlineLarge">Headline Large</Text>
              <Text variant="headlineMedium">Headline Medium</Text>
              <Text variant="headlineSmall">Headline Small</Text>
              <Divider style={styles.miniDivider} />
              <Text variant="titleLarge">Title Large</Text>
              <Text variant="titleMedium">Title Medium</Text>
              <Text variant="titleSmall">Title Small</Text>
              <Divider style={styles.miniDivider} />
              <Text variant="bodyLarge">Body Large - Regular text</Text>
              <Text variant="bodyMedium">Body Medium - Smaller text</Text>
              <Text variant="bodySmall">Body Small - Caption</Text>
              <Divider style={styles.miniDivider} />
              <Text variant="labelLarge">Label Large</Text>
              <Text variant="labelMedium">Label Medium</Text>
              <Text variant="labelSmall">Label Small</Text>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Buttons */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Buttons
              </Text>

              <PaperButton mode="contained" onPress={() => {}} style={styles.spacing}>
                Contained Button
              </PaperButton>

              <PaperButton mode="contained-tonal" onPress={() => {}} style={styles.spacing}>
                Tonal Button
              </PaperButton>

              <PaperButton mode="elevated" onPress={() => {}} style={styles.spacing}>
                Elevated Button
              </PaperButton>

              <PaperButton mode="outlined" onPress={() => {}} style={styles.spacing}>
                Outlined Button
              </PaperButton>

              <PaperButton mode="text" onPress={() => {}} style={styles.spacing}>
                Text Button
              </PaperButton>

              <PaperButton mode="contained" icon="heart" onPress={() => {}} style={styles.spacing}>
                With Icon
              </PaperButton>

              <PaperButton mode="contained" loading style={styles.spacing}>
                Loading
              </PaperButton>

              <PaperButton mode="contained" disabled style={styles.spacing}>
                Disabled
              </PaperButton>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Text Inputs */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Text Inputs
              </Text>

              <TextInput
                label="Name"
                value={text}
                onChangeText={setText}
                icon="account"
                placeholder="Enter your name"
                style={styles.spacing}
              />

              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                icon="email"
                keyboardType="email-address"
                placeholder="example@email.com"
                style={styles.spacing}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                icon="lock"
                secureTextEntry
                placeholder="Enter password"
                style={styles.spacing}
              />

              <TextInput
                label="Multiline"
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={4}
                style={styles.spacing}
              />

              <TextInput
                label="Disabled"
                value="Cannot edit"
                onChangeText={() => {}}
                disabled
                style={styles.spacing}
              />

              <TextInput
                label="Error Input"
                value={text}
                onChangeText={setText}
                error
                style={styles.spacing}
              />
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Chips */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Chips
              </Text>
              <View style={styles.chipRow}>
                <Chip icon="information" onPress={() => {}}>
                  Default
                </Chip>
                <Chip mode="outlined">Outlined</Chip>
                <Chip selected onPress={() => {}}>
                  Selected
                </Chip>
              </View>
              <View style={styles.chipRow}>
                <Chip icon="heart" onClose={() => {}}>
                  Closeable
                </Chip>
                <Chip disabled>Disabled</Chip>
                <Chip mode="flat">Flat</Chip>
              </View>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Icon Buttons */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Icon Buttons
              </Text>
              <View style={styles.iconRow}>
                <IconButton icon="heart" size={24} onPress={() => {}} />
                <IconButton icon="share-variant" size={24} onPress={() => {}} />
                <IconButton icon="delete" size={24} onPress={() => {}} />
                <IconButton icon="cog" size={24} onPress={() => {}} />
                <IconButton icon="plus" size={24} mode="contained" onPress={() => {}} />
                <IconButton icon="check" size={24} mode="contained-tonal" onPress={() => {}} />
              </View>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Avatars & Badges */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Avatars & Badges
              </Text>
              <View style={styles.avatarRow}>
                <View style={styles.avatarContainer}>
                  <Avatar.Text size={48} label="JD" />
                  <Badge style={styles.badge}>3</Badge>
                </View>
                <Avatar.Text size={48} label="AB" />
                <Avatar.Icon size={48} icon="account" />
                <Avatar.Image size={48} source={{ uri: 'https://i.pravatar.cc/150?img=1' }} />
              </View>
              <View style={styles.badgeRow}>
                <Badge>10</Badge>
                <Badge size={24}>99+</Badge>
                <Badge visible={false}>Hidden</Badge>
              </View>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Selection Controls */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Selection Controls
              </Text>

              <View style={styles.controlRow}>
                <Text variant="bodyLarge">Switch</Text>
                <Switch value={switchOn} onValueChange={setSwitchOn} />
              </View>

              <View style={styles.controlRow}>
                <Text variant="bodyLarge">Checkbox</Text>
                <Checkbox
                  status={checked ? 'checked' : 'unchecked'}
                  onPress={() => setChecked(!checked)}
                />
              </View>

              <Text variant="bodyMedium" style={styles.spacing}>
                Radio Buttons
              </Text>
              <RadioButton.Group onValueChange={setRadioValue} value={radioValue}>
                <View style={styles.controlRow}>
                  <Text>Option 1</Text>
                  <RadioButton value="first" />
                </View>
                <View style={styles.controlRow}>
                  <Text>Option 2</Text>
                  <RadioButton value="second" />
                </View>
                <View style={styles.controlRow}>
                  <Text>Option 3</Text>
                  <RadioButton value="third" />
                </View>
              </RadioButton.Group>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Segmented Buttons */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Segmented Buttons
              </Text>
              <SegmentedButtons
                value={segmentValue}
                onValueChange={setSegmentValue}
                buttons={[
                  { value: 'one', label: 'One', icon: 'star' },
                  { value: 'two', label: 'Two', icon: 'heart' },
                  { value: 'three', label: 'Three', icon: 'thumb-up' },
                ]}
              />
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Progress */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Progress Indicators
              </Text>
              <View style={styles.progressContainer}>
                <ActivityIndicator animating size="small" />
                <ActivityIndicator animating size="large" />
              </View>
              <ProgressBar progress={0.3} style={styles.spacing} />
              <ProgressBar progress={0.7} style={styles.spacing} />
              <ProgressBar indeterminate style={styles.spacing} />
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Lists */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Lists
              </Text>
              <List.Section>
                <List.Subheader>Items</List.Subheader>
                <List.Item
                  title="First Item"
                  description="Description"
                  left={renderFolderIcon}
                  right={renderChevronIcon}
                />
                <List.Item title="Second Item" description="Description" left={renderFileIcon} />
                <List.Accordion
                  title="Accordion"
                  left={renderFolderIcon}
                  expanded={expandedList}
                  onPress={() => setExpandedList(!expandedList)}
                >
                  <List.Item title="Sub Item 1" />
                  <List.Item title="Sub Item 2" />
                </List.Accordion>
              </List.Section>
            </Card.Content>
          </Card>

          <Divider style={styles.divider} />

          {/* Dialogs & Snackbars */}
          <Card style={styles.card} elevation={1}>
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Dialogs & Snackbars
              </Text>
              <Button
                title="Show Dialog"
                mode="contained"
                onPress={() => setDialogVisible(true)}
                style={styles.spacing}
              />
              <Button
                title="Show Snackbar"
                mode="outlined"
                onPress={() => setSnackbarVisible(true)}
                style={styles.spacing}
              />
            </Card.Content>
          </Card>

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>

      {/* FAB */}
      <FAB icon="plus" style={styles.fab} onPress={() => console.log('FAB')} />

      {/* Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Icon icon="alert" />
          <Dialog.Title>Dialog Title</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">This is a Material Design 3 dialog component.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <PaperButton onPress={() => setDialogVisible(false)}>Cancel</PaperButton>
            <PaperButton onPress={() => setDialogVisible(false)}>OK</PaperButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'Undo',
          onPress: () => console.log('Undo'),
        }}
      >
        This is a Snackbar message!
      </Snackbar>
    </View>
  );
};

export default DemoScreen;
