import React, { useEffect, useState, useCallback } from 'react';
import { client, useConfig, useVariable } from '@sigmacomputing/plugin';
import { Button } from './components/ui/button';
import { Settings as SettingsIcon } from 'lucide-react';
import Settings, { DEFAULT_SETTINGS } from './Settings';
import {
  SigmaConfig,
  PluginSettings,
  ConfigParseError
} from './types/sigma';
import PipelineReport from './components/PipelineReport';
import './App.css';

// Configure the plugin editor panel
client.config.configureEditorPanel([
  { name: 'reportContent', type: 'variable', label: 'Report Markdown Control' },
  { name: 'config', type: 'text', label: 'Settings Config (JSON)', defaultValue: '{}' },
  { name: 'editMode', type: 'toggle', label: 'Edit Mode' },
]);

// Mirror of theme presets for applying CSS variables after save
const PRESET_THEMES: Record<string, { name: string; colors: Record<string, string> }> = {
  light: {
    name: 'Light',
    colors: {
      '--background': '0 0% 100%',
      '--foreground': '240 10% 3.9%',
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary': '240 9% 10%',
      '--primary-foreground': '0 0% 98%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '240 4.8% 95.9%',
      '--accent-foreground': '240 5.9% 10%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '240 5.9% 10%',
    },
  },
  dark: {
    name: 'Dark',
    colors: {
      '--background': '240 10% 3.9%',
      '--foreground': '0 0% 98%',
      '--card': '240 10% 3.9%',
      '--card-foreground': '0 0% 98%',
      '--popover': '240 10% 3.9%',
      '--popover-foreground': '0 0% 98%',
      '--primary': '0 0% 98%',
      '--primary-foreground': '240 5.9% 10%',
      '--secondary': '240 3.7% 15.9%',
      '--secondary-foreground': '0 0% 98%',
      '--muted': '240 3.7% 15.9%',
      '--muted-foreground': '240 5% 64.9%',
      '--accent': '240 3.7% 15.9%',
      '--accent-foreground': '0 0% 98%',
      '--destructive': '0 62.8% 30.6%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 3.7% 15.9%',
      '--input': '240 3.7% 15.9%',
      '--ring': '240 4.9% 83.9%',
    },
  },
};

const applyThemeFromSettings = (settings: PluginSettings): void => {
  const theme = settings.styling?.theme || 'light';
  const colors = theme === 'custom'
    ? (settings.styling?.customColors || PRESET_THEMES.light.colors)
    : (PRESET_THEMES[theme]?.colors || PRESET_THEMES.light.colors);
  Object.entries(colors).forEach(([property, value]) => {
    document.documentElement.style.setProperty(property, value);
  });
};

const SAMPLE_MARKDOWN = `# 🏥 EMEA Pipeline Health Report for the week of March 11, 2026

"Success is not final, failure is not fatal: it is the courage to continue that counts—especially when your pipeline is stalled at 155 days in stage." — Winston Churchill

## 📊 Executive Summary

### 🟢 What's Working

- Darren Murray maintains exceptional execution with **8.0 avg. health score** across **15 deals** and **$1.1M ACV**, achieving **73% Green rate** with **80% active engagement** and **73% healthy velocity**.
- Edo Cannarsa's RSM team leads at **6.6 avg. score** with **33% Green rate** (54 of 163 deals) and **$19.8M ACV**, demonstrating structural execution discipline across top performers.

### 🟡 Where We Have Friction

- **72% of total pipeline at-risk** (273 deals, $22.0M ACV) with Yellow/Red status—velocity stalls plague **100% of top 5 high-risk deals** ($1.3M ACV) with stage durations averaging **110 days vs. 54 day target** (2.0x benchmark).
- CAE DBX team exhibits critical distress at **5.6 avg. score** with **60% Red rate** (24 of 40 deals) and **$2.3M ACV**, signaling systemic execution gaps requiring immediate intervention.

### ⚡ Leadership Action Required This Week

- Deploy immediate pipeline disqualification reviews for **Matt Saunders** (22 deals, 68% Red, 5.2 avg. score) and **Merlin O'Doherty** (17 deals, 53% Red, 5.7 avg. score) to reduce noise and focus on viable opportunities.
- Execute velocity unblock protocol on **$1.3M stalled high-risk deals** (Avon 155 days, Evoke 148 days, Adidas 146 days, Smollan 85 days) with executive escalation and procurement timeline reset within 7 days.

## 🏆 Performance Leaders

**Overall Success Theme:** Top performers demonstrate consistent sub-7-day activity recency with 73-80% active engagement, maintaining healthy velocity through multi-threaded stakeholder relationships and disciplined next-step execution.

| AE Name | Team | Manager | Avg. Health Score | Deal Count | Total ACV | Primary Success Drivers |
|---|---|---|---|---|---|---|
| Darren Murray | RSM | Edo Cannarsa | 8.0 | 15 | $1,084,680 | **80% active engagement** (12 of 15 deals) with 73% healthy velocity and 73% multi-threading compliance—demonstrates disciplined touchpoint cadence with 73% Green deal rate. |
| Gordon Lindsay | RSM | Edo Cannarsa | 7.1 | 14 | $1,435,000 | **50% Green deal rate** (7 of 14) with 50% healthy velocity and multi-threaded stakeholder depth—maintains consistent execution fundamentals despite velocity headwinds on 21% of pipeline. |
| James Hendrickson | RSM | Edo Cannarsa | 7.1 | 14 | $3,160,850 | **50% Green deal rate** (7 of 14) with 57% active engagement and strong multi-threading—manages highest ACV in top 3 with balanced risk distribution across 14 opportunities. |

## 🎯 Development Opportunities

**Overall Gap Theme:** Bottom performers exhibit systemic next-step discipline failures with 50-68% Red deal rates, compounded by 86-95% velocity stall rates and inadequate activity recency requiring immediate coaching on pipeline hygiene and disqualification protocols.

| AE Name | Team | Manager | Avg. Health Score | Deal Count | Total ACV | Primary Coaching Focus |
|---|---|---|---|---|---|---|
| Matt Saunders | CAE DBX | TBH_L4_EMEA_DBX_CAE_EMEA | 5.2 | 22 | $1,105,000 | **68% Red deal rate** (15 of 22) with 86% velocity stall rate and 50% next-step discipline failure—requires immediate pipeline disqualification and executive sponsorship escalation on remaining viable deals. |
| George Treschi | CAE SNOW | TBH_L4_EMEA_SNOW_CAE_EMEA | 5.6 | 9 | $520,000 | **56% Red deal rate** (5 of 9) with 78% velocity stall rate and 44% activity discipline gaps—needs coaching on stakeholder mapping and touchpoint cadence to reduce single-threading risk. |
| Merlin O'Doherty | RSM | Daniel Hague | 5.7 | 17 | $1,160,000 | **53% Red deal rate** (9 of 17) with 71% velocity stall rate and 47% next-step discipline failure—requires deal review to disqualify non-viable opportunities and focus on high-probability pipeline. |

## 🚨 Priority Attention Deals

| Opportunity | AE | ACV | Health Score | Stage | Days in Stage | Primary Constraint | Required Action |
|---|---|---|---|---|---|---|---|
| Avon - (IBI) New Business | James Hendrickson | $425,050 | 6 | 5 - Solution Selection | 155 | Stalled velocity (4.4x benchmark) with 117-day meeting gap despite multi-threading | Secure executive meeting with new owners (Regent) within 7 days to confirm timeline and move to procurement stage |
| Evoke PLC New Business | James Hendrickson | $350,000 | 7 | 3 - Establish Success Criteria | 148 | Stalled velocity (1.6x benchmark) with 35-day call/meeting gap | Chase champion on Snowflake update and schedule technical validation call to unblock procurement decision |
| Smollan New Business | James Hendrickson | $250,000 | 7 | 2 - Discovery | 85 | Stalled velocity (1.5x benchmark) with initiative delayed until May | Confirm May timeline with champion and establish interim touchpoint cadence to maintain engagement |
| Adidas New Business | Matthew Tunstall | $250,000 | 7 | 4 - Solution Evaluation | 146 | Stalled velocity (4.2x benchmark) with 85-day meeting gap | Schedule call with Philipp Keese to discuss MSFT data pipeline and Power BI capacity issues |
| Almarai New Business | James Hendrickson | $250,000 | 7 | 2 - Discovery | 17 | Single-threaded risk with 23-day meeting gap | Expand stakeholder mapping beyond Nizar and partner to secure multi-threaded engagement before stage progression |

## ⚡ Top 5 Weekly CTAs

1. **Execute Pipeline Disqualification Reviews for Matt Saunders and Merlin O'Doherty**

   - Expected Next Week: Matt Saunders' deal count reduced from 22 to <15 with avg. health score improvement from 5.2 to 6.0+; Merlin O'Doherty's Red deal rate reduced from 53% to <40%.

2. **Deploy Velocity Unblock Protocol on $1.3M Stalled High-Risk Deals**

   - Expected Next Week: Avon, Evoke, Adidas, and Smollan deals show executive meeting scheduled within 7 days with health scores moving from 6-7 to 8+ through activity and velocity improvements.

3. **Implement CAE DBX Team Intervention with Immediate Coaching on Pipeline Hygiene**

   - Expected Next Week: CAE DBX team avg health score improves from 5.6 to 6.2+ with Red deal rate reduced from 60% to <50% through disqualification and next-step discipline improvements.

4. **Establish Multi-Threading Protocol for Single-Threaded Deals**

   - Expected Next Week: Almarai and other single-threaded deals show second stakeholder contact established with engagement plan documented.

5. **Reset Procurement Timelines on Stalled Enterprise Deals**

   - Expected Next Week: All deals >100 days in stage have documented timeline reset or disqualification decision with updated close date in CRM.
`;

// Defensively unwrap variable values — Sigma may return primitives, {value: ...}, or nested objects
function unwrapVariable(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const v = raw as Record<string, unknown>;
    if (typeof v.value === 'string') return v.value;
    if (v.value && typeof v.value === 'object') {
      const inner = v.value as Record<string, unknown>;
      if (typeof inner.value === 'string') return inner.value;
    }
  }
  return '';
}

const App: React.FC = (): React.JSX.Element => {
  const config: SigmaConfig = useConfig();
  const [reportContent] = useVariable(config.reportContent || '');
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [settings, setSettings] = useState<PluginSettings>(DEFAULT_SETTINGS);

  // Parse config JSON and load settings
  useEffect(() => {
    if (config.config?.trim()) {
      try {
        const parsedConfig = JSON.parse(config.config) as Partial<PluginSettings>;
        const newSettings: PluginSettings = { ...DEFAULT_SETTINGS, ...parsedConfig };
        setSettings(newSettings);
      } catch (err) {
        const error: ConfigParseError = {
          message: 'Invalid config JSON',
          originalError: err
        };
        console.error('Config parse error:', error);
        setSettings(DEFAULT_SETTINGS);
      }
    } else {
      setSettings(DEFAULT_SETTINGS);
    }
  }, [config.config]);

  // Apply saved styling whenever settings change
  useEffect(() => {
    if (settings?.styling) {
      applyThemeFromSettings(settings);
    }
  }, [settings]);

  const handleSettingsSave = useCallback((newSettings: PluginSettings): void => {
    setSettings(newSettings);
    setShowSettings(false);
  }, []);

  const handleShowSettings = useCallback((): void => {
    setShowSettings(true);
  }, []);

  const handleCloseSettings = useCallback((): void => {
    setShowSettings(false);
  }, []);

  // Read markdown from the bound Sigma control variable
  const controlMarkdown = unwrapVariable(reportContent);
  const debugInfo = `type: ${typeof reportContent} | raw: ${JSON.stringify(reportContent)?.slice(0, 120)}`;

  // Fall back to sample data in local dev when no control is wired
  const markdownText = controlMarkdown || SAMPLE_MARKDOWN;

  const emptyMessage = 'Bind the "Report Markdown Control" in the editor panel to get started.';

  return (
    <div className="min-h-screen relative">
      {config.editMode && (
        <>
          <Button
            className="fixed top-4 right-4 z-50 gap-2 shadow-lg"
            onClick={handleShowSettings}
            size="sm"
          >
            <SettingsIcon className="h-4 w-4" />
            Settings
          </Button>
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 text-green-400 text-xs font-mono px-3 py-1 truncate">
            {debugInfo}
          </div>
        </>
      )}

      {markdownText ? (
        <PipelineReport markdown={markdownText} />
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center max-w-sm p-8">
            <p className="text-slate-500 text-sm">{emptyMessage}</p>
          </div>
        </div>
      )}

      <Settings
        isOpen={showSettings}
        onClose={handleCloseSettings}
        currentSettings={settings}
        onSave={handleSettingsSave}
        client={client}
      />
    </div>
  );
};

export default App;


