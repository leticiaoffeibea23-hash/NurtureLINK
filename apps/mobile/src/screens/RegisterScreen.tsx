import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ScrollView,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../App';
import { useAppStore, RegForm } from '../store';
import {
  ChevronLeft, ChevronRight, Check, WifiOff, Baby, User, CalendarDays,
  Phone, MapPin, FileText, Info, ChevronDown, X, Search, MapPinned, Globe,
} from 'lucide-react-native';
import { syncNow } from '../sync/orchestrator';
import { fonts } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

// Ghana Northern Regions → Districts → Communities
const GHANA_LOCATION_DATA: Record<string, Record<string, string[]>> = {
  'Northern Region': {
    'Sagnarigu Municipal': [
      'Barugu', 'Choggu', 'Dohigu', 'Gizaa', 'Gurugu',
      'Kakpayili', 'Kanvili', 'Kasalgu', 'Katariga', 'Kpinkpanaa',
      'Kpuyangli', 'Kukuo', 'Kumbuyili', 'Lamashegu', 'Nyanshegu',
      'Sagnarigu', 'Teshie', 'Voggu', 'Zagyuri',
    ],
    'Tamale Metropolitan': [
      'Aboabo', 'Bamvim', 'Choggu Naa', 'Dichemso', 'Jisonayili',
      'Kalpohin', 'Kpobigu', 'Lamashegu', 'Nyohini', 'Sabonjida',
      'Sakasaka', 'Tishigu', 'Vittin', 'Wamale',
    ],
    'Kumbungu': [
      'Gupanarigu', 'Kumbungu', 'Kpene', 'Nyankpala', 'Tunayili', 'Zuo',
    ],
    'Tolon': [
      'Bamvim', 'Dibila', 'Kpalbe', 'Kpene', 'Tolon', 'Wuba', 'Zuo',
    ],
    'Savelugu': [
      'Diari', 'Nanton', 'Pong Tamale', 'Savelugu', 'Tampion',
    ],
    'Nanton': [
      'Gbullung', 'Karaga', 'Nanton', 'Wulensi',
    ],
    'Mion': [
      'Bimbila', 'Demon', 'Gushegu', 'Salaga', 'Sang',
    ],
  },
  'North East Region': {
    'East Mamprusi': [
      'Gambaga', 'Langbinsi', 'Nalerigu', 'Nakpayili', 'Yagaba',
    ],
    'West Mamprusi': [
      'Janga', 'Nakpayili', 'Walewale',
    ],
    'Mamprugu Moagduri': [
      'Kubori', 'Soo', 'Yagaba',
    ],
    'Bunkpurugu Nyankpala': [
      'Bunkpurugu', 'Nakpayili', 'Nyankpala',
    ],
    'Yunyoo-Nasuan': [
      'Nasuan', 'Yunyoo',
    ],
  },
  'Savannah Region': {
    'West Gonja': [
      'Bole', 'Damongo', 'Larabanga', 'Murugu', 'Yapei',
    ],
    'East Gonja': [
      'Buipe', 'Busunu', 'Salaga', 'Tuluwe',
    ],
    'Sawla-Tuna-Kalba': [
      'Bole', 'Kalba', 'Sawla', 'Tuna',
    ],
    'Bole': [
      'Bamboi', 'Bole', 'Tinga',
    ],
    'North East Gonja': [
      'Canteen', 'Karaga', 'Kpandai',
    ],
  },
  'Upper East Region': {
    'Bolgatanga Municipal': [
      'Bolgatanga', 'Kalbeo', 'Sumbrungu', 'Yorogo',
    ],
    'Kassena-Nankana Municipal': [
      'Navrongo', 'Nayorigo', 'Paga', 'Sirigu',
    ],
    'Bawku Municipal': [
      'Bawku', 'Pusiga', 'Widana',
    ],
    'Builsa North': [
      'Fumbisi', 'Kanjarga', 'Sandema',
    ],
    'Talensi': [
      'Tongo', 'Vea', 'Worikambo',
    ],
    'Binduri': [
      'Binduri', 'Garu',
    ],
  },
  'Upper West Region': {
    'Wa Municipal': [
      'Busa', 'Kpongu', 'Wa', 'Yipala',
    ],
    'Sissala East': [
      'Gwollu', 'Tumu', 'Wellembelle',
    ],
    'Sissala West': [
      'Hamile', 'Jeffisi', 'Leo',
    ],
    'Lawra': [
      'Lawra', 'Nandom', 'Piina',
    ],
    'Jirapa': [
      'Hamile', 'Jirapa', 'Ko',
    ],
  },
};

const RELATIONSHIPS = ['Mother', 'Father', 'Grandparent', 'Guardian'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function calcEddFromLmp(lmpIso: string): string {
  const d = new Date(lmpIso);
  d.setDate(d.getDate() + 280);
  return d.toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={sh.label}>{label}</Text>;
}
const sh = StyleSheet.create({
  label: {
    fontSize: 11, fontFamily: fonts.bold, fontWeight: '700', color: '#6B7280',
    letterSpacing: 0.7, textTransform: 'uppercase',
    marginBottom: 12, marginTop: 4,
  },
});

function TypeSelector({
  value, onChange,
}: { value: RegForm['type']; onChange: (t: RegForm['type']) => void }) {
  return (
    <View style={ts.row}>
      {([
        { v: 'child', label: 'Child', Icon: Baby },
        { v: 'pregnant', label: 'Pregnant woman', Icon: User },
      ] as const).map(({ v, label, Icon }) => (
        <TouchableOpacity
          key={v}
          style={[ts.btn, value === v ? ts.btnActive : ts.btnInactive]}
          onPress={() => onChange(v)}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ selected: value === v }}
        >
          <Icon size={18} color={value === v ? '#FFFFFF' : '#08283B'} />
          <Text style={[ts.label, value === v ? ts.textActive : ts.textInactive]}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const ts = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1.5,
  },
  btnActive: { backgroundColor: '#08283B', borderColor: '#08283B' },
  btnInactive: { backgroundColor: '#FDFDFD', borderColor: '#D1D5DB' },
  label: { fontSize: 14, fontFamily: fonts.semiBold, fontWeight: '600' },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: '#08283B' },
});

function ChipSelector<T extends string>({
  options, value, onChange,
}: { options: readonly T[]; value: T | string; onChange: (v: T) => void }) {
  return (
    <View style={chip.wrap}>
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          style={[chip.item, value === o ? chip.itemActive : chip.itemInactive]}
          onPress={() => onChange(o)}
          accessibilityRole="button"
          accessibilityLabel={o}
          accessibilityState={{ selected: value === o }}
        >
          <Text style={[chip.text, value === o ? chip.textActive : chip.textInactive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const chip = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5 },
  itemActive: { backgroundColor: '#08283B', borderColor: '#08283B' },
  itemInactive: { backgroundColor: '#FDFDFD', borderColor: '#D1D5DB' },
  text: { fontSize: 14, fontFamily: fonts.medium, fontWeight: '500' },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: '#08283B' },
});

function CommunityPicker({
  value, onChange, communities,
}: { value: string; onChange: (v: string) => void; communities: readonly string[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? communities.filter((c) => c.toLowerCase().includes(q)) : communities;
  }, [query, communities]);

  const queryTrimmed = query.trim();
  const exactMatch = communities.some((c) => c.toLowerCase() === queryTrimmed.toLowerCase());
  const showCustom = queryTrimmed.length > 0 && !exactMatch;

  function select(v: string) {
    onChange(v); setQuery(''); setOpen(false);
  }

  return (
    <>
      <TouchableOpacity style={cp.trigger} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Select community">
        <MapPinned size={18} color={value ? '#08283B' : '#9CA3AF'} />
        <Text style={[cp.triggerText, !value && cp.triggerPlaceholder]}>{value || 'Select community'}</Text>
        <ChevronDown size={16} color="#9CA3AF" />
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={cp.modal}>
          <View style={cp.modalHeader}>
            <Text style={cp.modalTitle}>Select community</Text>
            <TouchableOpacity onPress={() => { setQuery(''); setOpen(false); }} style={cp.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          <View style={cp.searchWrap}>
            <Search size={16} color="#9CA3AF" style={cp.searchIcon} />
            <TextInput style={cp.searchInput} placeholder="Search or type community name…" placeholderTextColor="#9CA3AF" value={query} onChangeText={setQuery} autoFocus autoCapitalize="words" clearButtonMode="while-editing" returnKeyType="search" />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={[cp.row, value === item && cp.rowSelected]} onPress={() => select(item)} accessibilityRole="button" accessibilityLabel={item}>
                <Text style={[cp.rowText, value === item && cp.rowTextSelected]}>{item}</Text>
                {value === item && <Check size={16} color="#08283B" strokeWidth={2.5} />}
              </TouchableOpacity>
            )}
            ListFooterComponent={showCustom ? (
              <TouchableOpacity style={cp.customRow} onPress={() => select(queryTrimmed)} accessibilityRole="button" accessibilityLabel={`Use ${queryTrimmed}`}>
                <MapPin size={16} color="#427CAF" />
                <Text style={cp.customText}>Use <Text style={cp.customBold}>"{queryTrimmed}"</Text> as community</Text>
              </TouchableOpacity>
            ) : null}
            ListEmptyComponent={!showCustom ? <Text style={cp.empty}>No communities match.</Text> : null}
          />
        </View>
      </Modal>
    </>
  );
}
const cp = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, height: 52,
  },
  triggerText: { flex: 1, fontSize: 15, fontFamily: fonts.regular, color: '#08283B' },
  triggerPlaceholder: { color: '#9CA3AF' },
  modal: { flex: 1, backgroundColor: '#FDFDFD' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F1F3',
  },
  modalTitle: { fontSize: 17, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', margin: 16,
    backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 14, height: 48,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, fontFamily: fonts.regular, color: '#08283B' },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F9FAFB',
  },
  rowSelected: { backgroundColor: '#F0F7FF' },
  rowText: { fontSize: 15, fontFamily: fonts.regular, color: '#374151' },
  rowTextSelected: { color: '#08283B', fontWeight: '600' },
  customRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#F0F7FF',
    margin: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE',
  },
  customText: { fontSize: 14, fontFamily: fonts.regular, color: '#1D4ED8', flex: 1 },
  customBold: { fontWeight: '700' },
  empty: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, fontFamily: fonts.regular, marginTop: 32 },
});

// Simple picker modal (no custom-entry option) — used for Region and District
function SelectPicker({
  title, placeholder, value, options, onChange, icon: Icon, disabled,
}: {
  title: string;
  placeholder: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  icon: React.ComponentType<{ size: number; color: string }>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
  }, [query, options]);

  function select(v: string) { onChange(v); setQuery(''); setOpen(false); }

  return (
    <>
      <TouchableOpacity
        style={[cp.trigger, disabled && sp.disabled]}
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
      >
        <Icon size={18} color={value ? '#08283B' : '#9CA3AF'} />
        <Text style={[cp.triggerText, !value && cp.triggerPlaceholder]}>{value || placeholder}</Text>
        <ChevronDown size={16} color="#9CA3AF" />
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={cp.modal}>
          <View style={cp.modalHeader}>
            <Text style={cp.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => { setQuery(''); setOpen(false); }} style={cp.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          {options.length > 6 && (
            <View style={cp.searchWrap}>
              <Search size={16} color="#9CA3AF" style={cp.searchIcon} />
              <TextInput style={cp.searchInput} placeholder={`Search ${title.toLowerCase()}…`} placeholderTextColor="#9CA3AF" value={query} onChangeText={setQuery} autoFocus autoCapitalize="words" clearButtonMode="while-editing" />
            </View>
          )}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={[cp.row, value === item && cp.rowSelected]} onPress={() => select(item)} accessibilityRole="button" accessibilityLabel={item}>
                <Text style={[cp.rowText, value === item && cp.rowTextSelected]}>{item}</Text>
                {value === item && <Check size={16} color="#08283B" strokeWidth={2.5} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={cp.empty}>No results.</Text>}
          />
        </View>
      </Modal>
    </>
  );
}
const sp = StyleSheet.create({
  disabled: { opacity: 0.45 },
});

function DateField({
  label, value, onChange, isFuture, hint,
}: { label: string; value: string; onChange: (iso: string) => void; isFuture?: boolean; hint?: string }) {
  const [showPicker, setShowPicker] = useState(false);
  const dateObj = value ? new Date(value) : null;
  const pickerValue = dateObj ?? (isFuture ? new Date() : new Date(2000, 0, 1));
  const maxDate = isFuture ? undefined : new Date();

  return (
    <View>
      {Platform.OS !== 'ios' && (
        <Pressable style={[dp.btn, showPicker && dp.btnOpen]} onPress={() => setShowPicker((v) => !v)} accessibilityRole="button" accessibilityLabel={label}>
          <CalendarDays size={18} color={dateObj ? '#08283B' : '#9CA3AF'} />
          <Text style={[dp.btnText, !dateObj && dp.btnPlaceholder]}>{dateObj ? formatDisplayDate(value) : `Select ${label.toLowerCase()}`}</Text>
        </Pressable>
      )}
      {Platform.OS === 'ios' && (
        <>
          <Pressable style={[dp.btn, dp.btnOpen]} onPress={() => setShowPicker((v) => !v)} accessibilityRole="button" accessibilityLabel={label}>
            <CalendarDays size={18} color={dateObj ? '#08283B' : '#9CA3AF'} />
            <Text style={[dp.btnText, !dateObj && dp.btnPlaceholder]}>{dateObj ? formatDisplayDate(value) : `Select ${label.toLowerCase()}`}</Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker value={pickerValue} mode="date" display="spinner" maximumDate={maxDate}
              onChange={(_, date) => { if (date) onChange(date.toISOString().slice(0, 10)); }} style={{ marginTop: 4 }} />
          )}
        </>
      )}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker value={pickerValue} mode="date" display="default" maximumDate={maxDate}
          onChange={(_, date) => { setShowPicker(false); if (date) onChange(date.toISOString().slice(0, 10)); }}
          onDismiss={() => setShowPicker(false)} />
      )}
      {Platform.OS === 'web' && (
        <DateTimePicker value={pickerValue} mode="date" display="default" maximumDate={maxDate}
          onChange={(_, date) => { if (date) onChange(date.toISOString().slice(0, 10)); }} />
      )}
      {hint ? <Text style={dp.hint}>{hint}</Text> : null}
    </View>
  );
}
const dp = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, height: 52,
  },
  btnOpen: { borderColor: '#08283B' },
  btnText: { fontSize: 15, fontFamily: fonts.regular, color: '#08283B', flex: 1 },
  btnPlaceholder: { color: '#9CA3AF' },
  hint: { fontSize: 12, fontFamily: fonts.regular, color: '#6B7280', marginTop: 5, marginLeft: 2 },
});

function ConsentRow({
  checked, onToggle, clientType,
}: { checked: boolean; onToggle: () => void; clientType: RegForm['type'] }) {
  const isPregnant = clientType === 'pregnant';
  const title = isPregnant ? 'Client consent given' : 'Caregiver consent given';
  const desc = isPregnant
    ? 'The client has been informed that this data will be stored and used for health monitoring by the CHPS compound.'
    : 'The caregiver has been informed that this data will be stored and used for health monitoring by the CHPS compound.';

  return (
    <TouchableOpacity
      style={[ct.wrap, checked ? ct.wrapChecked : ct.wrapUnchecked]}
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityLabel={title}
      accessibilityState={{ checked }}
      activeOpacity={0.8}
    >
      <View style={[ct.box, checked ? ct.boxChecked : ct.boxUnchecked]}>
        {checked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
      </View>
      <View style={ct.body}>
        <Text style={ct.title}>{title}</Text>
        <Text style={ct.desc}>{desc}</Text>
      </View>
    </TouchableOpacity>
  );
}
const ct = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 12, borderWidth: 1.5, padding: 14, gap: 12 },
  wrapChecked: { backgroundColor: '#F3FAF7', borderColor: '#BCF0DA' },
  wrapUnchecked: { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  boxChecked: { backgroundColor: '#FF5A00', borderColor: '#FF5A00' },
  boxUnchecked: { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' },
  body: { flex: 1 },
  title: { fontSize: 14, fontFamily: fonts.bold, fontWeight: '700', color: '#08283B', marginBottom: 4 },
  desc: { fontSize: 12, fontFamily: fonts.regular, color: '#6B7280', lineHeight: 17 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

// ─── MotherPicker ──────────────────────────────────────────────────────────────

interface MotherPickerProps {
  candidates: import('../store').DemoClient[];
  value: string;
  onChange: (id: string) => void;
}

function MotherPicker({ candidates, value, onChange }: MotherPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = candidates.find((c) => c.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? candidates.filter((c) => c.name.toLowerCase().includes(q) || c.community.toLowerCase().includes(q)) : candidates;
  }, [candidates, query]);

  if (candidates.length === 0) return null;

  return (
    <>
      <TouchableOpacity style={mp.trigger} onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Link to mother">
        <User size={18} color={selected ? '#08283B' : '#9CA3AF'} />
        <Text style={[mp.triggerText, !selected && mp.placeholder]} numberOfLines={1}>
          {selected ? `${selected.name} · ${selected.community}` : 'Select mother (optional)'}
        </Text>
        {selected ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ) : (
          <ChevronDown size={16} color="#9CA3AF" />
        )}
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#FDFDFD' }}>
          <View style={cp.modalHeader}>
            <Text style={cp.modalTitle}>Link to mother</Text>
            <TouchableOpacity onPress={() => { setQuery(''); setOpen(false); }} style={cp.closeBtn}>
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          <View style={cp.searchWrap}>
            <Search size={16} color="#9CA3AF" style={cp.searchIcon} />
            <TextInput style={cp.searchInput} placeholder="Search by name or community…" placeholderTextColor="#9CA3AF" value={query} onChangeText={setQuery} autoFocus autoCapitalize="words" clearButtonMode="while-editing" />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[cp.row, value === item.id && cp.rowSelected]}
                onPress={() => { onChange(item.id); setQuery(''); setOpen(false); }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[cp.rowText, value === item.id && cp.rowTextSelected]}>{item.name}</Text>
                  <Text style={{ fontSize: 12, fontFamily: fonts.regular, color: '#9CA3AF', marginTop: 1 }}>{item.community}</Text>
                </View>
                {value === item.id && <Check size={16} color="#08283B" strokeWidth={2.5} />}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={cp.empty}>No matching clients found.</Text>}
          />
        </View>
      </Modal>
    </>
  );
}
const mp = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, height: 52,
  },
  triggerText: { flex: 1, fontSize: 15, fontFamily: fonts.regular, color: '#08283B' },
  placeholder: { color: '#9CA3AF' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export function RegisterScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { regForm, setRegField, saveClient, currentUser, clients } = useAppStore();
  const [step, setStep] = useState<1 | 2>(1);

  const isChild    = regForm.type === 'child';
  const isPregnant = regForm.type === 'pregnant';
  const isStep1Ready = regForm.name.trim().length > 0 && regForm.consent;

  // Candidates for mother-child linking: all pregnant/postpartum/lactating women
  const motherCandidates = useMemo(
    () => clients.filter((c) => c.type === 'pregnant'),
    [clients],
  );

  function handleLmpChange(iso: string) {
    setRegField('lmp', iso);
    setRegField('edd', calcEddFromLmp(iso));
  }

  function handleBack() {
    if (step === 2) setStep(1);
    else navigation.goBack();
  }

  function doSave() {
    const newClient = saveClient();
    if (!newClient) {
      Alert.alert('Incomplete form', 'Please enter a name and confirm consent.');
      return;
    }
    syncNow('foreground').catch(() => {});
    navigation.navigate('Client', { clientId: newClient.id });
  }

  function handleSave() {
    // G8: fuzzy duplicate check — first name match within same community
    const enteredFirst = regForm.name.trim().split(' ')[0].toLowerCase();
    const duplicates = clients.filter((c) => {
      const existingFirst = c.name.split(' ')[0].toLowerCase();
      return (
        existingFirst === enteredFirst &&
        c.community.toLowerCase() === regForm.community.toLowerCase()
      );
    });
    if (duplicates.length > 0) {
      Alert.alert(
        'Possible existing record',
        `"${duplicates[0].name}" in ${regForm.community} may already be registered. Review before creating a new record.`,
        [
          { text: 'Review existing', style: 'cancel' },
          { text: 'Create anyway', onPress: doSave },
        ],
      );
    } else {
      doSave();
    }
  }

  const typeLabel = isChild ? 'Child' : 'Pregnant woman';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} accessibilityRole="button" accessibilityLabel={step === 2 ? 'Back to step 1' : 'Go back'} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ChevronLeft size={24} color="#FDFDFD" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Register a client</Text>
          <Text style={styles.headerStepLabel}>
            {step === 1 ? 'Step 1 of 2 · About the client' : 'Step 2 of 2 · Optional details'}
          </Text>
        </View>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
      </View>

      {/* ── Scrollable form ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ══════════ STEP 1 ══════════ */}
        {step === 1 && (
          <>
            {/* Client type */}
            <View style={styles.section}>
              <SectionHeader label="Client type" />
              <TypeSelector
                value={regForm.type}
                onChange={(t) => {
                  setRegField('type', t);
                  setRegField('lifestage', t === 'pregnant' ? 'pregnant' : '');
                  setRegField('linkedClientId', '');
                }}
              />
              {/* Lifecycle stage — pregnant women only */}
              {isPregnant && (
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.fieldLabel}>Lifecycle stage</Text>
                  <View style={chip.wrap}>
                    {(['pregnant', 'postpartum', 'lactating'] as const).map((stage) => {
                      const LABELS: Record<string, string> = {
                        pregnant: 'Pregnant', postpartum: 'Postpartum', lactating: 'Lactating',
                      };
                      const active = (regForm.lifestage || 'pregnant') === stage;
                      return (
                        <TouchableOpacity
                          key={stage}
                          style={[chip.item, active ? chip.itemActive : chip.itemInactive]}
                          onPress={() => setRegField('lifestage', stage)}
                          accessibilityRole="button"
                          accessibilityLabel={LABELS[stage]}
                          accessibilityState={{ selected: active }}
                        >
                          <Text style={[chip.text, active ? chip.textActive : chip.textInactive]}>
                            {LABELS[stage]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* About the client */}
            <View style={styles.section}>
              <SectionHeader label="About the client" />

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{isChild ? "Child's full name" : "Mother's full name"}</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={isChild ? "Child's full name" : "Mother's full name"}
                  placeholderTextColor="#9CA3AF"
                  value={regForm.name}
                  onChangeText={(v) => setRegField('name', v)}
                  autoCapitalize="words"
                  returnKeyType="next"
                  accessibilityLabel="Full name"
                />
              </View>

              {isChild && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Sex</Text>
                  <ChipSelector
                    options={['Male', 'Female'] as const}
                    value={regForm.sex}
                    onChange={(v) => setRegField('sex', v)}
                  />
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{isChild ? 'Date of birth' : "Mother's date of birth (optional)"}</Text>
                <DateField
                  label={isChild ? 'Date of birth' : "Mother's date of birth"}
                  value={regForm.dob}
                  onChange={(iso) => setRegField('dob', iso)}
                  isFuture={false}
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <SectionHeader label="Location" />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Region</Text>
                <SelectPicker
                  title="Select region"
                  placeholder="Select region"
                  value={regForm.region}
                  options={Object.keys(GHANA_LOCATION_DATA)}
                  icon={Globe}
                  onChange={(r) => {
                    setRegField('region', r);
                    setRegField('district', '');
                    setRegField('community', '');
                  }}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>District</Text>
                <SelectPicker
                  title="Select district"
                  placeholder={regForm.region ? 'Select district' : 'Select region first'}
                  value={regForm.district}
                  options={regForm.region ? Object.keys(GHANA_LOCATION_DATA[regForm.region] ?? {}) : []}
                  icon={MapPin}
                  disabled={!regForm.region}
                  onChange={(d) => {
                    setRegField('district', d);
                    setRegField('community', '');
                  }}
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Community / Town</Text>
                <CommunityPicker
                  value={regForm.community}
                  onChange={(c) => setRegField('community', c)}
                  communities={
                    regForm.district
                      ? (GHANA_LOCATION_DATA[regForm.region]?.[regForm.district] ?? [])
                      : []
                  }
                />
              </View>
            </View>

            {/* Consent */}
            <View style={styles.section}>
              <SectionHeader label="Consent" />
              <ConsentRow checked={regForm.consent} onToggle={() => setRegField('consent', !regForm.consent)} clientType={regForm.type} />
            </View>
          </>
        )}

        {/* ══════════ STEP 2 ══════════ */}
        {step === 2 && (
          <>
            {/* Summary banner */}
            <View style={styles.summaryBanner}>
              <View style={styles.summaryAvatar}>
                {isChild ? <Baby size={20} color="#427CAF" /> : <User size={20} color="#427CAF" />}
              </View>
              <View style={styles.summaryBody}>
                <Text style={styles.summaryName} numberOfLines={1}>{regForm.name || '—'}</Text>
                <Text style={styles.summaryMeta}>
                  {typeLabel}{regForm.community ? ` · ${regForm.community}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.optionalNote}>
              <Info size={14} color="#6B7280" />
              <Text style={styles.optionalNoteText}>All fields below are optional — tap Save to skip and fill them later.</Text>
            </View>

            {/* Pregnancy details */}
            {isPregnant && (
              <View style={styles.section}>
                <SectionHeader label="Pregnancy details" />
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Last menstrual period</Text>
                  <DateField label="Last menstrual period" value={regForm.lmp} onChange={handleLmpChange} isFuture={false} hint="Expected delivery date is calculated automatically" />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Expected delivery date</Text>
                  <DateField label="Expected delivery date" value={regForm.edd} onChange={(iso) => setRegField('edd', iso)} isFuture />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>ANC folder number</Text>
                  <View style={styles.iconInput}>
                    <FileText size={18} color="#9CA3AF" style={styles.iconInputIcon} />
                    <TextInput style={styles.iconInputText} placeholder="e.g. ANC-2026-00142" placeholderTextColor="#9CA3AF" value={regForm.ancFolderNumber} onChangeText={(v) => setRegField('ancFolderNumber', v)} autoCapitalize="characters" returnKeyType="next" accessibilityLabel="ANC folder number" />
                  </View>
                </View>
                <View style={styles.row2}>
                  <View style={[styles.fieldGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>Gravida</Text>
                    <TextInput style={styles.textInput} placeholder="No. of pregnancies" placeholderTextColor="#9CA3AF" value={regForm.gravida} onChangeText={(v) => setRegField('gravida', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" returnKeyType="next" accessibilityLabel="Gravida" />
                  </View>
                  <View style={[styles.fieldGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>Parity</Text>
                    <TextInput style={styles.textInput} placeholder="No. of births" placeholderTextColor="#9CA3AF" value={regForm.parity} onChangeText={(v) => setRegField('parity', v.replace(/[^0-9]/g, ''))} keyboardType="numeric" returnKeyType="next" accessibilityLabel="Parity" />
                  </View>
                </View>
                <View style={styles.infoRow}>
                  <Info size={14} color="#427CAF" />
                  <Text style={styles.infoText}>Gravida = total pregnancies including this one. Parity = previous births.</Text>
                </View>
              </View>
            )}

            {/* Child health records */}
            {isChild && (
              <View style={styles.section}>
                <SectionHeader label="Child health records" />
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>CWC card number</Text>
                  <View style={styles.iconInput}>
                    <FileText size={18} color="#9CA3AF" style={styles.iconInputIcon} />
                    <TextInput style={styles.iconInputText} placeholder="e.g. CWC-2026-00089" placeholderTextColor="#9CA3AF" value={regForm.cwcCardNumber} onChangeText={(v) => setRegField('cwcCardNumber', v)} autoCapitalize="characters" returnKeyType="next" accessibilityLabel="CWC card number" />
                  </View>
                </View>
              </View>
            )}

            {/* Caregiver */}
            {isChild && (
              <View style={styles.section}>
                <SectionHeader label="Caregiver" />
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Caregiver name</Text>
                  <TextInput style={styles.textInput} placeholder="Caregiver's full name" placeholderTextColor="#9CA3AF" value={regForm.caregiverName} onChangeText={(v) => setRegField('caregiverName', v)} autoCapitalize="words" returnKeyType="next" accessibilityLabel="Caregiver name" />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Relationship to child</Text>
                  <ChipSelector options={RELATIONSHIPS} value={regForm.caregiverRelationship} onChange={(v) => setRegField('caregiverRelationship', v)} />
                </View>
              </View>
            )}

            {/* Link to mother — children only */}
            {isChild && motherCandidates.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Link to mother's record" />
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Mother already registered?</Text>
                  <MotherPicker
                    candidates={motherCandidates}
                    value={regForm.linkedClientId}
                    onChange={(id) => setRegField('linkedClientId', id)}
                  />
                </View>
                <View style={styles.infoRow}>
                  <Info size={14} color="#427CAF" />
                  <Text style={styles.infoText}>Linking creates a two-way record connection shown on both profiles.</Text>
                </View>
              </View>
            )}

            {/* Household contact */}
            <View style={styles.section}>
              <SectionHeader label="Household contact" />
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone number</Text>
                <View style={styles.iconInput}>
                  <Phone size={18} color="#9CA3AF" style={styles.iconInputIcon} />
                  <TextInput style={styles.iconInputText} placeholder="e.g. 0241234567" placeholderTextColor="#9CA3AF" value={regForm.phone} onChangeText={(v) => setRegField('phone', v)} keyboardType="phone-pad" returnKeyType="next" accessibilityLabel="Phone number" />
                </View>
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Landmark or household description</Text>
                <View style={styles.iconInput}>
                  <MapPin size={18} color="#9CA3AF" style={styles.iconInputIcon} />
                  <TextInput style={styles.iconInputText} placeholder="e.g. Near the borehole, red gate" placeholderTextColor="#9CA3AF" value={regForm.landmark} onChangeText={(v) => setRegField('landmark', v)} autoCapitalize="sentences" returnKeyType="next" accessibilityLabel="Landmark" />
                </View>
              </View>
            </View>
          </>
        )}

        {/* Offline note */}
        <View style={styles.offlineNote}>
          <WifiOff size={16} color="#427CAF" />
          <Text style={styles.offlineText}>Saved on device · encrypted · syncs later</Text>
        </View>
      </ScrollView>

      {/* ── Footer button ── */}
      <View style={[styles.saveWrap, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
        {step === 1 ? (
          <TouchableOpacity
            style={[styles.saveBtn, isStep1Ready ? styles.saveBtnActive : styles.saveBtnDisabled]}
            onPress={() => setStep(2)}
            disabled={!isStep1Ready}
            accessibilityRole="button"
            accessibilityLabel="Continue to step 2"
            accessibilityState={{ disabled: !isStep1Ready }}
          >
            <Text style={styles.saveBtnText}>Continue</Text>
            <ChevronRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.saveBtn, styles.saveBtnActive]}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save client"
          >
            <Text style={styles.saveBtnText}>Save client</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F4F5' },

  header: {
    backgroundColor: '#08283B',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnPlaceholder: { width: 36 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontFamily: fonts.bold, fontWeight: '700', color: '#FFFFFF' },
  headerStepLabel: { fontSize: 11, fontFamily: fonts.regular, color: '#92C9F9', marginTop: 2 },

  progressTrack: { height: 3, backgroundColor: '#1D4060' },
  progressFill: { height: 3, backgroundColor: '#FF5A00' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },

  section: {
    backgroundColor: '#FDFDFD', borderRadius: 16, padding: 16, marginBottom: 16,
  },

  fieldGroup: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12, fontFamily: fonts.semiBold, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase',
    color: '#6B7280', marginBottom: 8,
  },

  textInput: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB',
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.regular, color: '#08283B', height: 52,
  },

  iconInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  iconInputIcon: { marginRight: 10 },
  iconInputText: { flex: 1, fontSize: 15, fontFamily: fonts.regular, color: '#08283B', paddingVertical: 13 },

  row2: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },

  readOnlyField: {
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingVertical: 13, paddingHorizontal: 14, height: 52, justifyContent: 'center',
  },
  readOnlyText: { fontSize: 14, fontFamily: fonts.medium, color: '#6B7280', fontWeight: '500' },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: -4, marginBottom: 4 },
  infoText: { fontSize: 12, fontFamily: fonts.regular, color: '#427CAF', flex: 1, lineHeight: 16 },

  // Step 2 summary banner
  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE',
    borderRadius: 14, padding: 14, marginBottom: 12,
  },
  summaryAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center',
  },
  summaryBody: { flex: 1 },
  summaryName: { fontSize: 15, fontFamily: fonts.bold, fontWeight: '700', color: '#1E3A5F' },
  summaryMeta: { fontSize: 12, fontFamily: fonts.regular, color: '#427CAF', marginTop: 2 },

  optionalNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F9FAFB', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 16,
  },
  optionalNoteText: { fontSize: 12, fontFamily: fonts.regular, color: '#6B7280', flex: 1, lineHeight: 17 },

  offlineNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF9E6', borderWidth: 1, borderColor: '#FFE18A',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 16,
  },
  offlineText: { fontSize: 13, fontFamily: fonts.medium, color: '#8C6900', fontWeight: '500', flex: 1 },

  saveWrap: {
    backgroundColor: '#FDFDFD', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    paddingHorizontal: 16, paddingTop: 12,
  },
  saveBtn: {
    height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  saveBtnActive: { backgroundColor: '#08283B' },
  saveBtnDisabled: { backgroundColor: '#B2BCC2' },
  saveBtnText: { fontSize: 15, fontFamily: fonts.semiBold, fontWeight: '600', color: '#FFFFFF' },
});
