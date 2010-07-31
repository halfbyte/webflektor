#!/usr/bin/env ruby
level_file = ARGV[0]
exit(5) unless File.exists?(level_file)






cf = ConfigFile.new(level_file)
puts cf.data.inspect