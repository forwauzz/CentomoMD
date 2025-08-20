import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Download, AlertTriangle, Info, AlertCircle, Bug, Zap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: number;
  timestamp: string;
  localTimestamp: string;
  level: string;
  category: string;
  component: string;
  event: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  metadata: Record<string, any>;
  errorMessage?: string;
  errorCode?: string;
}

interface LogSearchParams {
  startDate?: string;
  endDate?: string;
  level?: string;
  category?: string;
  event?: string;
  search?: string;
  limit: number;
  offset: number;
}

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<LogSearchParams>({
    limit: 50,
    offset: 0
  });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const { toast } = useToast();

  const loadLogs = async (source: 'memory' | 'database' = 'database') => {
    setLoading(true);
    try {
      const url = source === 'memory' ? '/api/logs/recent' : '/api/logs/search';
      const params = new URLSearchParams();
      
      if (source === 'database') {
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value !== undefined && value !== '' && value !== null) {
            params.append(key, value.toString());
          }
        });
      } else {
        if (searchParams.limit) params.append('count', searchParams.limit.toString());
        if (searchParams.level) params.append('level', searchParams.level);
        if (searchParams.category) params.append('category', searchParams.category);
      }

      const response = await fetch(`${url}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs || []);
      setTotalLogs(data.total || data.logs?.length || 0);
    } catch (error) {
      toast({
        title: "Error Loading Logs",
        description: "Failed to load system logs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs('database');
  }, []);

  const handleSearch = () => {
    const params = { ...searchParams, offset: 0 };
    
    if (startDate) {
      params.startDate = startDate.toISOString();
    }
    if (endDate) {
      params.endDate = endDate.toISOString();
    }
    
    setSearchParams(params);
    loadLogs('database');
  };

  const handleQuickSearch = (preset: string) => {
    const now = new Date();
    let start: Date;
    
    switch (preset) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case '2weeks':
        start = new Date(now);
        start.setDate(now.getDate() - 14);
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        break;
      default:
        return;
    }
    
    setStartDate(start);
    setEndDate(now);
    setSearchParams({ ...searchParams, startDate: start.toISOString(), endDate: now.toISOString(), offset: 0 });
    loadLogs('database');
  };

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'ERROR': case 'FATAL': return 'destructive';
      case 'WARN': return 'secondary';
      case 'INFO': return 'default';
      case 'DEBUG': return 'outline';
      default: return 'default';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': case 'FATAL': return <AlertTriangle className="h-4 w-4" />;
      case 'WARN': return <AlertCircle className="h-4 w-4" />;
      case 'INFO': return <Info className="h-4 w-4" />;
      case 'DEBUG': return <Bug className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-CA', {
      timeZone: 'America/Montreal',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            System Logs Manager
          </CardTitle>
          <CardDescription>
            Search and analyze system events, errors, and performance metrics. Find historical incidents for medical practice compliance.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Database Search</TabsTrigger>
          <TabsTrigger value="recent">Recent (Memory)</TabsTrigger>
        </TabsList>
        
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Historical Logs</CardTitle>
              <CardDescription>Find specific incidents by date range, level, or keywords</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Search Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => handleQuickSearch('today')}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSearch('week')}>
                  Last Week
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSearch('2weeks')}>
                  Last 2 Weeks
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleQuickSearch('month')}>
                  Last Month
                </Button>
              </div>

              {/* Search Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Level</label>
                  <Select value={searchParams.level || ""} onValueChange={(value) => setSearchParams({...searchParams, level: value || undefined})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All levels</SelectItem>
                      <SelectItem value="ERROR">Errors</SelectItem>
                      <SelectItem value="WARN">Warnings</SelectItem>
                      <SelectItem value="INFO">Info</SelectItem>
                      <SelectItem value="DEBUG">Debug</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={searchParams.category || ""} onValueChange={(value) => setSearchParams({...searchParams, category: value || undefined})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All categories</SelectItem>
                      <SelectItem value="AUTH">Authentication</SelectItem>
                      <SelectItem value="API">API Requests</SelectItem>
                      <SelectItem value="FORM">Form Processing</SelectItem>
                      <SelectItem value="VOICE">Voice Processing</SelectItem>
                      <SelectItem value="AI">AI Processing</SelectItem>
                      <SelectItem value="SECURITY">Security</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Text</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search events, errors..."
                      value={searchParams.search || ""}
                      onChange={(e) => setSearchParams({...searchParams, search: e.target.value || undefined})}
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Logs (Memory Buffer)</CardTitle>
              <CardDescription>Latest system events from memory buffer - immediate access</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => loadLogs('memory')} disabled={loading}>
                Refresh Recent Logs
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Log Entries ({totalLogs} total)</span>
            <Badge variant="outline">{logs.length} shown</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No logs found matching your criteria.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <Card key={log.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getLevelBadgeVariant(log.level)} className="flex items-center gap-1">
                          {getLevelIcon(log.level)}
                          {log.level}
                        </Badge>
                        <Badge variant="outline">{log.category}</Badge>
                        <span className="text-sm font-mono">{log.event}</span>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{formatTimestamp(log.localTimestamp)}</span>
                        {log.component && <span className="ml-2">• {log.component}</span>}
                        {log.sessionId && <span className="ml-2">• Session: {log.sessionId.slice(-8)}</span>}
                      </div>

                      {log.errorMessage && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          <strong>Error:</strong> {log.errorMessage}
                          {log.errorCode && <span className="ml-2">({log.errorCode})</span>}
                        </div>
                      )}

                      {Object.keys(log.metadata).length > 0 && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View metadata
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}